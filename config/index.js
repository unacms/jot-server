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
 * Init data from config.json file and allows to use it in all project's files
 */
var nconf = require('nconf'),
	path =  require('path');

nconf.env().
	 argv().
	 file({file: path.join(__dirname, "config.json")});

module.exports = nconf;