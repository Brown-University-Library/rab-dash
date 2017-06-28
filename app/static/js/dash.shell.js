dash.shell = ( function() {
	var
		viewResource,
		initModule;

	viewResource = function ( data ) {
		dash.viewer.resetViewer();
		dash.viewer.viewResourceDetails( data );
	};

	initModule = function ( $container ) {
		dash.viewer.initModule( $container );
	};

	$( window ).on( 'viewQueryCompleted', function(e, data) {
		e.preventDefault();

		viewResource( data );
	});

	return {
		initModule : initModule
	}
}());