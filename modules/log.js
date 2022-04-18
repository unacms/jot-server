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
 * Wrapper for Winston logger
 * Allows to view info in development mode,  otherwise writs error and warning to the log file
 */
 
const oConfig = require('../config'),
	{ createLogger, format, transports } = require('winston');

function getLogger(oModule) {
  const sPath = oModule.filename.split('/').slice(-2).join('/'),
	  oLogger = createLogger({
		  transports: [
			  new transports.File({
				  format: format.combine(
					  format.splat(),
					  format.simple(),
				  ),
				  filename: oConfig.get('log'),
				  humanReadableUnhandledException: true,
				  level: 'error',
				  label: sPath
			  })
		  ]
	  });

	if (oConfig.get('mode').toString() === 'development') {
		oLogger.add(new transports.Console({
			format: format.combine(
				format.colorize(),
				format.splat(),
				format.simple(),
			),
			level: 'info'
		}));
	}
  
  return oLogger;
}

module.exports = getLogger;

/** @} */
