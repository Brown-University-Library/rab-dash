dash.lister = ( function() {
	var
		state_map = {
			editing : null
		},

		configMap, jqueryMap,
		loadSelectResults,
		onClickViewResource,
		onClickSelectEditingItem,
		onClickEnableEditing,
		buildHtml, initModule;

	buildHtml = function ( $container ) {
		var
			options_list,

			$lister,
			$select_form, $select_options,
			$select_opt, $input,
			$select_results_list; 
			
			options_list = [
				{'value': 'organizations', 'display': 'Organizations'},
				{'value': 'venues', 'display': 'Venues'},
				{'value': 'concepts', 'display': 'Research Areas'}
			];

			$lister = $('<div/>', {'id': 'lister'});
			$select_form = $('<form/>');
			$select_options = $('<select/>');

			$.each( options_list, function (i, data_obj) {
				var $opt;

				$opt = $('<option/>', { 'value': data_obj.value })
					.text(data_obj.display);

				$select_options.append($opt);
			});

			$input = $('<input/>', {'type': 'submit'}).text('X');
			$select_results_list = $('<ul/>', {'class' : 'select-results-list'});

			$select_form.submit( function(e) {
				e.preventDefault();

				onSubmitGetResourceList( $select_options );
			});

			$select_form.append($select_options).append($input);
			$lister.append($select_form).append($select_results_list);
			$container.append($lister);

			jqueryMap = {
				$container : $container,
				$select_options : $select_options,
				$select_results_list : $select_results_list,
				$select_results_items : [],
				$selected_item : null
			};
	};

	loadSelectResults = function ( data ) {
		$.each(data, function(i, row) {
			var
				$li, $label, $edit_ctnr, $edit_btn; 

			$li = $('<li/>', { 	'class': 'selector-arrow',
													'data-rabid': row['rabid']});
			$label = $('<div/>', {'class': 'item-label'})
									.text(row['label']);
			$edit_ctnr = $('<div/>', {'class': 'editing-box'});
			$edit_btn = $('<button/>', {'class': 'enable-editing',
																	'html': '&plus;'});

			$label.click( function(e) {
				e.preventDefault()

				if ( state_map.editing === true ) {
					onClickSelectEditingItem( $li );
				}
				else {
					onClickViewResource( $li );
				}
			});

			$edit_btn.click( function(e) {
				e.preventDefault();

				state_map.editing = true;
				onClickEnableEditing( $li );
			});

			$edit_ctnr.append($edit_btn);
			$li.append($label).append($edit_ctnr);

			jqueryMap.$select_results_items.push($li);
			jqueryMap.$select_results_list.append($li);
		});		
	};

	onSubmitGetResourceList = function ( $select_options ) {
		var type_param;

		type_param = $select_options.find('option:selected').attr('value');
		configMap.shell.getResourceList( type_param );
	};

	onClickViewResource = function ( $li ) {
		var rabid;

		if ( jqueryMap.$selected_item === null ) {
			$li.addClass('selected');
			jqueryMap.$selected_item = $li;
			rabid = $li.attr('data-rabid');
			configMap.shell.viewSelectedListItem( rabid );			
		}
		else if ( $li === jqueryMap.$selected_item ) {
			$li.removeClass('selected');
			$jqueryMap.$selected_item = null;
		}
		else {
			jqueryMap.$selected_item.removeClass('selected');
			
			$li.addClass('selected');
			jqueryMap.$selected_item = $li;
			rabid = $li.attr('data-rabid');
			configMap.shell.viewSelectedListItem( rabid );
		}
	};

	onClickSelectEditingItem = function ( $li ) {
		var rabid;

		rabid = $li.attr('data-rabid');
			
		if ( $li.hasClass('selected') ) {
			$li.removeClass('selected');
			configMap.shell.removeSelectedListItem( rabid );
		}
		else if ( $li.hasClass('editing') ) {
				return true;
		}
		else {
			$li.addClass('selected');
			configMap.shell.addSelectedListItem( rabid );
		}
	};

	onClickEnableEditing = function ( $li ) {
		var rabid;

		jqueryMap.$select_results_items.forEach( function($item) {
			$item.removeClass('selected editing');
		});

		$li.removeClass('selected').addClass('editing');

		rabid = $li.attr('data-rabid');
		configMap.shell.editSelectedListItem( rabid );
	};

	initModule = function( $container ) {
		configMap = {
			shell : dash.shell
		};

		buildHtml( $container );
	};

	return {
		loadSelectResults: loadSelectResults,
		initModule : initModule
	};
}());