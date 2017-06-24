/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaMessenger UNA Core
  * @ingroup     UnaServer
  *
 * @{
 */

/**
 * Init server utils and param
 */ 
var oConfig = require('../config'),	// config file in jason format, contains projects server settings
	log = require('./log')(module), // logger, allows to log info, warnings and errors 
	oDomain = require('./domain'),
	aDomains = new Map(),
	oPrimus = require('primus'),
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
		/* View request details in development mode */
		log.info('connection from ip = %s, id = %s \n', oSpark.address.ip, oSpark.id);
		log.info('address \n', oSpark.address);
		
		var oConnect = null,
			sServerIP = '0.0.0.0';
		
		/* Init event listeners  */
		oSpark.on('data', (oData) => {
			sServerIP = oData.ip || sServerIP;

			/* Check if domain in allowed list, if not send respond and close connection */
			if (oConfig.get('domains') != "*" && !~oConfig.get('domains').indexOf(sServerIP)){
				log.warn('Access Denied for IP: IP = %s. It is not listed in allowed domains list', sServerIP);	
				oSpark.write({
								'action':'denied'
							 });
				oSpark.end();				
			}	
			
			/* Add Site's IP address to Domains list */
			if (!aDomains.has(sServerIP) && oData.action != 'before_delete')
				aDomains.set(sServerIP, new oDomain(sServerIP));
			
			oConnect = aDomains.get(sServerIP);
			log.info('server ip = %s \n', sServerIP, oData);
			
			/* Parse data and emit prop event  */
			if (typeof oData.action !== 'undefined' && !oSpark.emit(oData.action, oData))
					log.error('Invalid request: action = %s from IP = %s was not executed', oData.action, oSpark.address.ip, oData);		
			
		}) 
		/*  Messenger Init  listener */
		.on('init', (oData) => {
			log.info(oData, oSpark.id);	
			oConnect.addClient(oData.user_id, oSpark, oData.status).broadcastUpdatedStatus(oData.user_id, oSpark.id);
			
			if (typeof oData.status !== 'undefined')
					oSpark.emit('update_status', oData);			
		})
		/*  Member status update listener */
		.on('update_status', (oData) => {
			log.info(oData);
			
			var oUser =	oConnect.getClient(oData.user_id, oSpark); 
			
			if (typeof oUser === "undefined")
				oConnect.addClient(oData.user_id, oSpark, oData.status);
			else
				oUser.setStatus(oSpark.id, oData.status).updateStatus();
			
			setImmediate(() => {
				oConnect.broadcastUpdatedStatus(oData.user_id, oSpark.id);
			});
			
		})
		/*  Members close messenger listener */
		.on('before_delete', (oData) => {
			log.info(oData);
	
			setImmediate(() => {	  
				if (oConnect)
					oConnect.removeSocket(oData.user_id, oSpark).broadcastUpdatedStatus(oData.user_id, oSpark.id);
				else
					log.warn('Socket %s of member %d doesn\'t exist \n', oSpark.id, oData.user_id);	
			});
					
		})
		/*  Member typing a message listener */
		.on('typing',function(oData){
			log.info(oData);
			setImmediate(() => {
				oConnect.broadcastClients(oData, oSpark.id, oData.user_id);
			});
		})
		/*  Member sent a message listener */
		.on('msg',function(oData){
			setImmediate(() => {	
				var aResult = oConnect.broadcastClients(oData, oSpark.id, oData.user_id, true),
					oResponse = {
						action:'check_sent',
						sent:aResult,
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

/** @} */
