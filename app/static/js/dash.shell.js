dash.shell = ( function() {
	var
		loadResourceToViewer,

		addSelectedListItem, editSelectedListItem,
		removeSelectedListItem, viewSelectedListItem,
		initModule;

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
		dash.viewer.initModule( $container );
		dash.lister.initModule( $container );
	};

	return {
		getResourceList : getResourceList,
		viewSelectedListItem : viewSelectedListItem,
		initModule : initModule
	}
}());