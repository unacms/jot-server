/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	UnaMessenger UNA Core
  * @ingroup	UnaServer
  *
 * @{
 */

var log = require('./modules/log')(module),
	oDomain = require('domain').create();

oDomain.on('error', function(oError){
	log.error('Server Error', oError);
});

oDomain.run(function(){
	oServer = require('./modules/server');
	oServer.run();
});

/** @} */
