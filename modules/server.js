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
	oPrimus = require('primus'),
	oJwt = require('jsonwebtoken'), // jwt tokens
	Rooms = require('primus-rooms'),
	oIpAddress = require('ip-address').Address4,
	oPrimusServer = new oPrimus.createServer({
		port:oConfig.get('port'), 
		transformer:oConfig.get('transformer'),
		'root': oConfig.get('root'), 
		'cert': oConfig.get('cert'),
		'key': oConfig.get('key'),
	});

// add rooms to Primus
oPrimusServer.plugin('rooms', Rooms);

/**
 * Main function to run the server
 */
exports.run = function(){
	oPrimusServer.on('connection', (oSpark) => {
		const sUserIP = oSpark && oSpark.address.ip.replace(/^::ffff:/, '');

		let sDomain = null;
		/* View request details in development mode */
		log.info('connection from ip = %s, id = %s %s\n', sUserIP, oSpark.id);

		/* Init event listeners */
		oSpark.on('data', (oData) => {
			const { action, user_id, lot, ident, ip } = oData;

			/* Parse data and emit prop event  */
			if (typeof action !== 'undefined' && !oSpark.emit(action, oData)) {
				log.error('Invalid request: action = %s from IP = %s was not executed, request %s', action, sUserIP, oData);
				oSpark.write({ action: 'denied' });
				oSpark.end();
			}

			if (lot && sDomain) {
				if (!~oPrimusServer.rooms().indexOf(lot))
					oPrimusServer.join(oSpark, `${sDomain}:${lot}`);
			} else
				oPrimusServer.join(oSpark, sDomain);
			
			/* init Spark user info */
			oSpark.user_id = user_id;

			log.info('Total rooms on the server = %s \n', oPrimusServer.rooms().length);
			oPrimusServer.rooms().forEach(function(sRoom){
				log.info('Room = %s, contains = %d connected user(s):', sRoom, oPrimusServer.room(sRoom).clients().length);
				oPrimusServer.room(sRoom).clients().forEach((oClient) => {
					log.info('user %s %s', oClient, sUserIP);
				});
			});
		}) 
		/*  Messenger Init  listener */
		.on('init', (oData) => {
			const { jwt, ident, ip, rooms } = oData;

			sDomain = ident || ip; // TODO: remove this condition in future. It was added for backward compatibility. ident should be main domain key

			log.info('Domain\'s identifier = %s \n', sDomain);
			log.info('Incoming original params for init request %s', oData);

			if (oConfig.get('domains') != "*"){
				if (!ip || ( oIpAddress.isValid(ip) && !~oConfig.get('domains').indexOf(ip) )) {
					log.error('Access Denied: IP = %s, client id = %s. IP doesn\'t exist in domains list. \n', ip, oSpark.id);
					oSpark.write({ action : 'denied' });
					oSpark.end();
				}
			}

			/* to use Jwt authentication in case if the secret has been set */
			const sJwtToken = oConfig.get('secret');
			if (sJwtToken){
				oJwt.verify(jwt, sJwtToken, function(error, decoded) {
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

			log.info('User %s ( 0 - not logged ) with info %s joined to these rooms:', sUserIP, oData);
			if (typeof rooms === 'object')
					if (Array.isArray(rooms)) {
						rooms.forEach((iTalkId) => {
							if (oPrimusServer.join(oSpark, `${sDomain}:${iTalkId}`))
								log.info('%s', `${sDomain}:${iTalkId}`);
						});
					}

			log.info('Existed rooms list %s', oPrimusServer.rooms());
		})
		/*  Member status update listener */
		.on('update_status', (oData) => {
			log.info('Update status request', oData);
			oPrimusServer.room(sDomain).except(oSpark.id).write(oData);
		})
		/*  Members close messenger listener */
		.on('before_delete', (oData) => {
			log.info('User left messenger %s', oSpark.id, oData);
			oPrimusServer.leave(oSpark, `${sDomain}:*`);
		})
		/*  Remove profile from the room */
		.on('leave', ({ lot, profile }) => {
			log.info('User left the room', `${sDomain}:${lot}`, profile);
			oPrimusServer.leave(oSpark, `${sDomain}:${lot}`);
		})
		/*  Join user to the room */
		.on('join', ({ lot, profiles }) => {
			log.info('Join users to the talks %d rooms %s', lot, profiles);
			if (!(Array.isArray(profiles) && profiles.length))
				return;

			oPrimusServer.rooms().forEach(function(sRoom){
				oPrimusServer.room(sRoom).clients().forEach((oClient) => {
					if (oPrimusServer.spark(oClient).user_id)
					log.info('user %s %s', oClient, oPrimusServer.spark(oClient).user_id);
			});
			});

			oPrimusServer.join(oSpark, `${sDomain}:${lot}`);
		})
		/*  Member typing a message listener */
		.on('typing',function(oData){
			const { lot } = oData;
			log.info('Typing event occurred, request: ', oData);
			oPrimusServer.room(`${sDomain}:${lot}`).except(oSpark.id).write(oData);
		})
		/*  Member sent a message listener */
		.on('msg',function(oData){
			const { lot } = oData,
				  oRoom = oSpark.room(`${sDomain}${lot}`).except(oSpark.id);

			log.info('Message event occurred, request: ', oData);
			log.info('Send message to clients. Total clients to send = %d', oRoom.clients().length);

			oRoom.write(oData);
			if (lot)
				log.info('Total connected users to the room = %d', oPrimusServer.room(`${sDomain}:${lot}`).clients().length, oPrimusServer.room(`${sDomain}:${lot}`).clients());
		})
		/*  Primus Error listener */
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
