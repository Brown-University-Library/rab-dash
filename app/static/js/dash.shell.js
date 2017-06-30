dash.shell = ( function() {
	var

		jqueryMap,

		loadResourceToViewer, editViewedResource,

		addSelectedListItem, editSelectedListItem,
		removeSelectedListItem, viewSelectedListItem,
		unselectListItem,
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

	editViewedResource = function ( rabid ) {
		dash.lister.editingListItem( rabid );
	};

	getResourceList = function ( type_param ) {
		dash.data.resource.list( type_param, loadResourceList );
	};

	viewSelectedListItem = function ( rabid ) {
		dash.data.resource.view( rabid, loadResourceToViewer );
	};

	unselectListItem = function () {
		dash.viewer.resetViewer();
	}

	initModule = function ( $container ) {
		buildHtml( $container );

		dash.lister.initModule( jqueryMap.$shell );
		dash.viewer.initModule( jqueryMap.$shell );
	};

	return {
		getResourceList : getResourceList,
		viewSelectedListItem : viewSelectedListItem,
		unselectListItem : unselectListItem,
		editViewedResource : editViewedResource,
		initModule : initModule
	}
}());