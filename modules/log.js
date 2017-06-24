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
 * Wrapper for Winston logger
 * Allows to view info in development mode,  otherwise writs error and warning to the log file
 */
 
var oConfig = require('../config'),
	oWinston = require('winston')

function getLogger(oModule) {
  var sPath = oModule.filename.split('/').slice(-2).join('/'),
	  oLogger = new oWinston.Logger();

	if (oConfig.get('mode') == 'development')	
		oLogger.add(oWinston.transports.Console,{
			colorize: true,
			level: 'info',
		  });	  

    oLogger.add(oWinston.transports.File,{ 
		filename: oConfig.get('log'),
		humanReadableUnhandledException: true,
		level: 'error',
		label:sPath
	});
	  
  
  return oLogger;
}

module.exports = getLogger;

/** @} */
