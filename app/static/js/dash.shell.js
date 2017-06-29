dash.shell = ( function() {
	var

		jqueryMap,

		loadResourceToViewer,

		addSelectedListItem, editSelectedListItem,
		removeSelectedListItem, viewSelectedListItem,
		buildHtml, initModule;

	buildHtml = function ( $container ) {
		$shell = $('<div/>', { 'id' : 'shell' });

		$container.append($shell);

		jqueryMap = {
			$container : $container,
			$shell : $shell
		};
	};

	loadResourceList = function ( data ) {
		dash.lister.loadSelectResults( data );
	};

	loadResourceToViewer = function ( data ) {
		dash.viewer.resetViewer();
		dash.viewer.viewResourceDetails( data );
	};

	getResourceList = function ( type_param ) {
		dash.data.resource.list( type_param, loadResourceList );
	};

	viewSelectedListItem = function ( rabid ) {
		dash.data.resource.view( rabid, loadResourceToViewer );
	};

	initModule = function ( $container ) {
		buildHtml( $container );

		dash.lister.initModule( jqueryMap.$shell );
		dash.viewer.initModule( jqueryMap.$shell );
	};

	return {
		getResourceList : getResourceList,
		viewSelectedListItem : viewSelectedListItem,
		initModule : initModule
	}
}());