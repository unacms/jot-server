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
 * oClient class
 *
 * Contains info about each profile connected to the messenger and methods to work with it
 *
 */

var
	oConfig = require('../config'),   
	log = require('./log')(module);

/**
* Create Client class object
* @param int ProfileId
* @param object oSocket
* @param int iStatus Profile status (online, away, offline)
*/
function oClient(iProfileId, oSocket, iStatus){
	this.iProfileId = iProfileId || 0; // profile Id
	this.aSockets = new Map();	// all profile's sockets
	this.iProfileStatus = oConfig.get('ONLINE'); // set user status online
	   
	this.addSocket(oSocket, iStatus);

	// define size property, returns number of sockets
	Object.defineProperty(this, 'size', {
			get: function() {			 
			  return this.aSockets.size;
			}
	});
}
/**
* Add new socket to existed client.
* @param object oSocket
* @param int iStatus Profile status (online, away, offline)
* @return object this to allow to chain methods
*/
oClient.prototype.addSocket = function(oSocket, iStatus){
	if (!this.aSockets.has(oSocket.id)){
		this.aSockets.set(oSocket.id, {
											status: typeof iStatus === "undefined" ? oConfig.get('ONLINE') : iStatus,
											spark: oSocket
										});
		this.iProfileStatus = oConfig.get('ONLINE');
	}	 

	return this;
}
/**
* Remove  all profile's sockets
* @return int number of removed sockets
*/
oClient.prototype.removeSockets = function(){
	var iCount = 0,
		_this = this;
	   
	this.aSockets.forEach(function(oSocket, sId, oObject){
		if (typeof oSocket.spark !== "undefined"){
				_this.removeSocket(sId);
				iCount++;
		}
	});
   
	return iCount;
}
/**
* Remove certain socket of the profile
* @param  string sId socket name
* @return object this to allow to chain methods
*/
oClient.prototype.removeSocket = function(sId){
	if (this.aSockets.has(sId)){	   
		var oSocket = this.aSockets.get(sId);
		if (typeof oSocket.spark !== "undefined")
			oSocket.spark.end();
		   
		this.aSockets.delete(sId);
		this.updateStatus();
	}
   
	return this;
}
/**
* Set Profile Status
* @param  string sId socket name
* @param int iStatus Profile status (online, away, offline)
* @return object this to allow to chain methods
*/
oClient.prototype.setStatus = function(sId, iStatus){
	if (this.aSockets.has(sId)){
		this.aSockets.get(sId).status = iStatus;
		this.updateStatus();
	}
   
	return this;
}

/**
* Calculate profile's status if profile has more then one socket
* @return object this to allow to chain methods
*
*readyState value:	
*OPENING = 1;	opening the connection.
*CLOSED  = 2;	not active connection.
*OPEN    = 3;	active connection.
*/
oClient.prototype.updateStatus = function(){
	var _this = this,
		bActiveExists = false;
	   
	if (!this.aSockets.size){
		this.iProfileStatus = oConfig.get('OFFLINE');
		return this;
	}   
	else	   
		this.aSockets.forEach(function(oSocket, sKey, oObject){			
			if (oSocket.spark.readyState != 3){
				_this.removeSocket(sKey);
				return;
			}
			
			if (oSocket.status == oConfig.get('ONLINE'))
					bActiveExists = true;
		});   
      
	_this.iProfileStatus = bActiveExists ? oConfig.get('ONLINE') : oConfig.get('AWAY');
  
	return this;
}

/**
* Get Profile Status
* @return int Profile Status
*/
oClient.prototype.getUserStatus = function(){
	return this.iProfileStatus;
}

/**
* Broadcast data to Profile's sockets
* @param Object oData
* @param  string sId socket name to exclude sender
*/
oClient.prototype.broadcastSockets = function(oData, sId){
	var _this=this,
		iSentSocketsCount = 0;

	if (this.aSockets.size == 0 || typeof oData === "undefined" || typeof sId === "undefined")
		return iSentSocketsCount;
	   
	this.aSockets.forEach(function(oSocket, sKey, oObject){
		if (typeof oSocket.spark === "undefined" || oSocket.spark.readyState != 3){
			_this.removeSocket(sKey);
			return;
		}
	   
		if (sId != sKey){
			if (oSocket.spark.write(oData))
				iSentSocketsCount++;
			else
				_this.removeSocket(sKey);
		}				
	});   
	   
	log.info('Sent to profile=%d (%d sockets number) %s',  this.iProfileId, iSentSocketsCount, this.aSockets.keys());
	return iSentSocketsCount;
}

module.exports = oClient;

/** @} */
