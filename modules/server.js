/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	UnaMessenger UNA Core
  * @ingroup	UnaServer
  *
 * @{
 */

/**
 * Init server utils and param
 */ 
const oConfig = require('../config'),	// config file in jason format, contains projects server settings
	log = require('./log')(module), // logger, allows to log info, warnings and errors 
	oDomain = require('./domain'),
	oJwt = require('jsonwebtoken'), // jwt tokens
	aDomains = new Map(),
	oPrimus = require('primus'),
	oIpAddress = require('ip-address').Address4,
	oPrimusServer = new oPrimus.createServer({
		port:oConfig.get('port'), 
		transformer:oConfig.get('transformer'),
		'root': oConfig.get('root'), 
		'cert': oConfig.get('cert'),
		'key': oConfig.get('key')
	});	

/**
 * Main function to run the server
 */
exports.run = function(){
	oPrimusServer.on('connection', (oSpark) => {
		let oConnect = null,
			sUserIP = oSpark && oSpark.address.ip.replace(/^::ffff:/, '');

		/* View request details in development mode */
		log.info('connection from ip = %s, id = %s \n', sUserIP, oSpark.id);
		if (oConfig.get('domains') != "*"){
			if (oIpAddress.isValid(sUserIP) && !~oConfig.get('domains').indexOf(sUserIP)) {
				log.warn('Access Denied: IP = %s. It is not listed in allowed domains list', sUserIP);
				oSpark.write({
					'action': 'denied'
				});
				oSpark.end();
			}
		};

		/* Init event listeners */
		oSpark.on('data', (oData) => {
			const { action } = oData;
			/* Parse data and emit prop event  */
			if (typeof action !== 'undefined' && !oSpark.emit(action, oData)) {
				log.error('Invalid request: action = %s from IP = %s was not executed, request %s', action, oSpark.address.ip, oData);
				oSpark.write({
					'action': 'denied'
				});
				oSpark.end();
			}
		})
		/*  Messenger Init  listener */
		.on('init', (oData) => {
			const { jwt, user_id, status, ident } = oData;
			log.info('Incoming original params for init request %s', oData);

			/* to use Jwt authentication in case if the secret has been set */
			if (oConfig.get('secret') !== ''){
				oJwt.verify(jwt, oConfig.get('secret'), function(error, decoded) {
					if (error) {
						log.error('JWT token is not verified! Attempt from IP = %s and request %s', sUserIP, oData);
						oSpark.write({ 'action': 'jwt-error' });
						oSpark.end();
					}
					else
					{
						oSpark.write({
							action: 'token-init',
							token: oSpark.id
						});

						log.info('JWT token is verified. Payload = ', decoded);
					}
				});
			}

			/* Add Site's IP address to Domains list */
			if (!aDomains.has(ident))
				aDomains.set(ident, new oDomain(ident));

			oConnect = aDomains.get(ident);
			log.info('Domain\'s identifier = %s \n', ident);

			oConnect.addClient(user_id, oSpark, status).broadcastUpdatedStatus(user_id, oSpark.id);
		})
		/*  Member status update listener */
		.on('update_status', (oData) => {
			log.info('Incoming original request', oData);

			setImmediate(() => {			
				var oUser =	oConnect.getClient(oData.user_id, oSpark); 
				
				if (typeof oUser === "undefined")
					oConnect.addClient(oData.user_id, oSpark, oData.status);
				else
					oUser.setStatus(oSpark.id, oData.status).updateStatus();

					oConnect.broadcastUpdatedStatus(oData.user_id, oSpark.id);
			});
			
		})
		/*  Members close messenger listener */
		.on('before_delete', (oData) => {
			log.info('Incoming original request', oData);
			
			setImmediate(() => {	  
				if (oConnect)
					oConnect.removeSocket(oData.user_id, oSpark).broadcastUpdatedStatus(oData.user_id, oSpark.id);
				else
					log.warn('Socket %s of member %d doesn\'t exist \n', oSpark.id, oData.user_id);	
			});
					
		})
		/*  Member typing a message listener */
		.on('typing',function(oData){
			log.info('Incoming original request', oData);
			
			setImmediate(() => {
				oConnect.broadcastClients(oData, oSpark.id, oData.user_id);
			});
		})
		/*  Member sent a message listener */
		.on('msg',function(oData){
			log.info('Incoming original request', oData);	
			setImmediate(() => {
				var aResult = oConnect.broadcastClients(oData, oSpark.id, oData.user_id),
					oResponse = {
						action:'check_sent',
						sent:aResult,
						addon: oData.addon || '',
						lot:oData.lot
					};
				
				log.info('Response to the client = ', oData, 'Sent to ', aResult, 'profile(s)');			
				oSpark.write(oResponse);
			});			
		})
		/*  Primus Erorr listener */
		.on('error', function(){
			log.error('Request error occurred(', oError, '), data = ', oStructure, ', from IP =', oSpark.address.ip);
		});			
	});
}

/*
	Generates new primus.js file for clients, you should rebuild it every time when server's settings are changed
	oPrimusServer.save(__dirname +'/primus.js');
*/

/** @} */
