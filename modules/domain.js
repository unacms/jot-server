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
 * oDomain class
 *
 * Contains info about each site/domain connected to the server and methods to work with it
 *
 */
 
var oConfig = require('../config'),
	oClient = require('./client'),
	log = require('./log')(module),
	aDomains = new Map();

/**
* Create Domain class object
* @param string Domain's IP
*/
function oDomain(sIp){
	this.sIp = sIp || '0.0.0.0';
	this.aClients = new Map(); // all domain's profiles connected to the server
	Object.defineProperty(this, 'size', {
		get: function() {
		  return this.aClients.size;
		}
	});
}

/**
* Add new Profile
* @param int ProfileId
* @param object oSocket
* @param int iStatus Profile status (online, away, offline)
*@return this to chain
*/
oDomain.prototype.addClient = function(iProfileId, oSocket, iStatus){
	var iStatus = iStatus || oConfig.get('ONLINE');
	
	if (this.aClients.has(iProfileId))
		this.aClients.get(iProfileId).addSocket(oSocket, iStatus).updateStatus();
	else
		this.aClients.set(iProfileId, new oClient(iProfileId, oSocket, iStatus)).get(iProfileId).updateStatus();	

	return this;
}

/**
* Get profile object
* @param int ProfileId
* @return object oClient class
*/
oDomain.prototype.getClient = function(iProfileId){
	if (iProfileId !== undefined && this.aClients.has(iProfileId))
		return this.aClients.get(iProfileId);
}

/**
* Remove profile from domain 
* @param int ProfileId
*/
oDomain.prototype.removeClient = function(iProfileId){
	if (this.aClients.size > 0 && this.aClients.has(iProfileId)){		
		this.aClients.get(iProfileId).removeSockets();
		this.aClients.delete(iProfileId);
	}	
}

/**
* Remove certain profile socket
* @param int ProfileId
* @param object oSocket
* @return this to chain
*/
oDomain.prototype.removeSocket = function(iProfileId, oSocket){
	if (this.aClients.has(iProfileId) && this.aClients.get(iProfileId).removeSocket(oSocket.id).size == 0)
		this.removeClient(iProfileId);
		
	return this;
}

/**
* Returns all domain's clients
* @return Map iterator or undefined
*/
oDomain.prototype.getClients = function(){
	if (this.aClients.size)
			return this.aClients.entries();
}

/**
* Update and Broadcat new profiles status
* @param int ProfileId
* @param string sId socket's name
* @return array list of profiles received message
*/
oDomain.prototype.broadcastUpdatedStatus = function(iProfileId, sId){
	var oUser =	this.getClient(iProfileId);
		iStatus = typeof oUser !== 'undefined' ? oUser.getUserStatus() : 0,
		oData = {
					action:'update_status',
					status:iStatus,
					user_id:iProfileId
				};
				
	return this.broadcastClients(oData, sId, iProfileId, true);
}

/**
* Broadcat all domains clients with data
* @param object oData data to sent
* @param string sId socket's name
* @param int iSender Profile sent data
* @param boolean bPass, true - exclude profile with all its sockets to get the data 
* @return array list of profiles received message
*/
oDomain.prototype.broadcastClients = function(oData, sId, iSender, bPass){
	var _this = this,
		aSentTo = [],
		bPass = bPass || false,
		iSender = (iSender && parseInt(iSender)) || 0;		
	
	log.info("Broadcast request from sId = %s, profile_id = %d, body:%s", sId, iSender, oData);
	
	if (this.aClients.size == 0 || typeof oData === "undefined" || !iSender) 
		return 0;
		
	this.aClients.forEach(function(oClient, sKey, oObject){
		if (iSender == oClient.iProfileId && bPass)
			return;
			
		if (oClient.broadcastSockets(oData, sId)){ 				
			if (oClient.getUserStatus() == 1)
					aSentTo.push(oClient.iProfileId);
		}		
		else 
			if (iSender != oClient.iProfileId)
				_this.removeClient(oClient.iProfileId);
	});
	
	log.info('Total sent to %d profile(s) \n', aSentTo.length);
	
	return aSentTo;
}

module.exports = oDomain;

/** @} */