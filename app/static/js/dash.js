var dash = (function () {
	'use strict';

	var initModule = function ( $container, config ) {
		// dash.data.configModule( config );
		// dash.data.initModule();
		dash.shell.initModule ( $container );
	};

	return { initModule: initModule };
}());