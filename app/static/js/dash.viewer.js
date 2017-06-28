dash.viewer = (function () {
	var
		jqueryMap,

		buildHtml, viewResourceDetails,
		loadDataProperties, loadObjectProperties,
		enableEditing,
		enableLiteralEditing, enableObjectEditing,
		onClickDeleteLiteral, onClickEditLiteral,
		onSubmitEditLiteral, onClickDeleteObjectProperty,
		resetViewer, initModule;

	buildHtml = function ( $container ) {
		var
			$viewer,
			$edit_btn, $reset_btn,
			$label_display, $uri_display,
			$literals_display, $triples_display,
			$literals_table;

		$viewer = $('<div/>', { 'class': 'viewer-container' });
		$edit_btn = $('<button/>', { 'class' : 'edit-resource-btn hidden' })
									.text('Edit');
		$reset_btn = $('<button/>', { 'class' : 'reset-viewer-btn hidden' })
									.text('Reset');
		$label_display = $('<h2/>', { 'class' : 'label-display' });
		$uri_display = $('<h3/>', { 'class' : 'uri-display' });
		$literals_display = $('<div/>', { 'class': 'literals-display' });
		$literals_table = $('<table/>', {'class': 'data-property-table' });
		$objects_display = $('<div/>', { 'class': 'triples-display' });

		$edit_btn.click( function (e) {
			e.preventDefault()

			enableEditing();
		});

		$reset_btn.click( function (e) {
			e.preventDefault()

			resetViewer();
		});

		$literals_display.append($literals_table);

		$viewer.append($edit_btn)
			.append($reset_btn).append($label_display).append($uri_display)
			.append($literals_display).append($objects_display);

		$container.append($viewer);

		jqueryMap = {
			$container : $container,
			$viewer : $viewer,
			$edit_btn : $edit_btn,
			$reset_btn : $reset_btn,
			$label_display : $label_display,
			$uri_display : $uri_display,
			$literals_display : $literals_display,
			$objects_display : $objects_display,
			$literals_table : $literals_table,
			$literal_values : [],
			$object_rows : []
		};
	};

	loadDataProperties = function ( data ) {
		var
			$table = jqueryMap.$literals_table;

		$.each(data, function (i, row) {
			var 
				$tr, $td_prd, $td_ltrl, $ltr_lst;

			$tr = $('<tr/>', { 'class' : 'data-property-row'});
			$td_prd = $('<td/>', { 'class' : 'data-property-col' })
						.text(row['predicate']);
			$td_ltr = $('<td/>', { 'class' : 'data-property-col' });
			$ltr_lst = $('<ul/>');

			$.each(row['value'], function(i, val) {
				var
					$ltr_val;

				$ltr_val = $('<li/>', {	'class': 'literal-value',
										'data-datatype': val['dt'],
										'data-subject': data['uri'],
										'data-predicate': row['predicate'],
										'data-literal': val['literal']})
							.text(val['text']);

				jqueryMap.$literal_values.push($ltr_val);
				$ltr_lst.append($ltr_val);
			});

			$td_ltr.append($ltr_lst);
			$tr.append($td_prd).append($td_ltr);
			$table.append($tr);
		});
	};

	loadObjectProperties = function ( data, uri, inOrOut ) {
		var
			$trp_details, $trp_hdr,
			$trp_hdr_sbj, $trp_hdr_prd, $trp_hdr_obj,
			$trp_table, $trp_row,
			$trp_row_sbj, $trp_row_prd, $trp_row_obj;

		$.each(data, function (i, row) {
			$trp_details = $('<details/>');

			$trp_hdr = $('<summary/>', {'class': 'triple-header'});
			$trp_hdr_sbj = $('<span/>', {'class': 'triple-sbj'});
			$trp_hdr_prd = $('<span/>', {'class': 'triple-prd'})
				.text(row['predicate']);
			$trp_hdr_obj = $('<span/>', {'class': 'triple-obj'});

			if ( inOrOut === 'in' ) {
				$trp_hdr_sbj.text(row['objects'].length)
			}
			else {
				$trp_hdr_obj.text(row['objects'].length)
			}

			$trp_hdr.append($trp_hdr_sbj).append($trp_hdr_prd)
				.append($trp_hdr_obj);

			$trp_table = $('<table/>', {'class': 'triple-table'});
			
			$.each(row['objects'], function(i, obj) {
				$trp_row = $('<tr/>');

				if ( inOrOut === 'in' ) {
					$trp_row_sbj = $('<td/>').text(obj);
					$trp_row_obj = $('<td/>').text(uri);
				}
				else {
					$trp_row_sbj = $('<td/>').text(uri);
					$trp_row_obj = $('<td/>').text(obj);
				}
				
				$trp_row_prd = $('<td/>').text(row['predicate']);
				
				$trp_row.append($trp_row_sbj)
					.append($trp_row_prd).append($trp_row_obj);

				jqueryMap.$object_rows.push($trp_row);
				$trp_table.append($trp_row);
			});

			$trp_details.append($trp_hdr).append($trp_table);
			jqueryMap.$objects_display.append($trp_details);
		});
	};

	viewResourceDetails = function ( data ) {
		jqueryMap.$literals_table.removeClass('hidden');
		jqueryMap.$reset_btn.removeClass('hidden');
		jqueryMap.$edit_btn.removeClass('hidden')
		jqueryMap.$label_display.text(data['label']);
		jqueryMap.$uri_display.text(data['uri']);
		jqueryMap.$viewer.attr('data-rabid', data['rabid']);

		loadDataProperties( data['literals'] );
		loadObjectProperties( data['objects']['in'], data['uri'], 'in');
		loadObjectProperties( data['objects']['out'], data['uri'], 'out');
	};

	enableEditing = function () {
		enableLiteralEditing();
		enableObjectEditing();
	};

	enableLiteralEditing = function() {
		jqueryMap.$literal_values.forEach( function($ltr_val) {
			var $edit_btn, $del_btn;

			$edit_btn = $('<button/>', {'class': 'triple-edit-literal'})
						.text('edit');
			$del_btn = $('<button/>', {'class': 'triple-delete-literal'})
					.text('X');
			$ltr_val.append($edit_btn).append($del_btn);

			$del_btn.click( function(e) {
				e.preventDefault();

				onClickDeleteLiteral( $ltr_val );
			});

			$edit_btn.click( function(e) {
				e.preventDefault();

				onClickEditLiteral( $ltr_val );
			});
		});
	};

	enableObjectEditing = function () {
		jqueryMap.$object_rows.forEach( function( $row ) {
			var
				$del_btn, $trp_row_del;

				$del_btn = $('<button/>').text('X');
				$trp_row_del = $('<td/>', {'class': 'del-triple'});

				$del_btn.click( function (e) {
					e.preventDefault();

					onClickDeleteObjectProperty( $row );
				});

				$trp_row_del.append($del_btn);
				$row.append($trp_row_del);
		});
	}

	resetViewer = function () {
		jqueryMap.$uri_display.empty();
		jqueryMap.$label_display.empty();
		jqueryMap.$literals_table.empty().addClass('hidden');
		jqueryMap.$objects_display.empty();
		jqueryMap.$viewer.attr('data-rabid', '');
		jqueryMap.$reset_btn.addClass('hidden');
		jqueryMap.$edit_btn.addClass('hidden')
		jqueryMap.$object_rows = [];
		jqueryMap.$literal_values = [];
	};

	onClickDeleteLiteral = function ( $ltr_val ) {
		var payload = {};
		payload['subject'] = $ltr_val.attr('data-subject');
		payload['predicate'] = $ltr_val.attr('data-predicate');
		payload['literal'] = $ltr_val.attr('data-literal');
		payload['datatype'] = $ltr_val.attr('data-datatype');
		
		configMap.resources.deleteLiteral(payload);
	};

	onClickDeleteObjectProperty = function ( $row ) {
		console.log( $row );
	};

	onClickEditLiteral = function ( $ltr_val ) {
		var 
			$form, $input, $submit;

		$form = $('<form/>');
		$submit = $('<input/>', {'type':'submit'});

		if ( $ltr_val.attr('data-literal').length > 30 ) {
			$input = $('<textarea/>', {	'rows': '10', 'cols': '50',
										'class':'triple-edit-literal-input'})
						.val($ltr_val.attr('data-literal'));
		}
		else {
			$input = $('<input/>', {	'type':'text',
										'class':'edit-literal-input'})
						.val($ltr_val.attr('data-literal'));;
		}

		$form.append($input).append($submit);
		$ltr_val.empty().append($form);

		$form.submit( function(e) {
			e.preventDefault();

			onSubmitEditLiteral( $ltr_val );
		})	
	};

	onSubmitEditLiteral = function ($ltr_val) {
		var payload = {};
		payload['subject'] = $ltr_val.attr('data-subject');
		payload['predicate'] = $ltr_val.attr('data-predicate');
		payload['current'] = $ltr_val.attr('data-literal');
		payload['datatype'] = $ltr_val.attr('data-datatype');

		payload['future'] = $ltr_val.find('.edit-literal-input')
				.val();

		configMap.resources.editLiteral(payload);		
	}

	initModule = function ( $container ) {
		buildHtml( $container );
	};

	return {
		resetViewer : resetViewer,
		viewResourceDetails: viewResourceDetails,
		initModule : initModule
	}
}());


// var addMergeCandidate = function( data ) {
// 	var tbl = $('#merge-candidates');
// 	var pointers = data['pointers'];
// 	var targets = data['targets'];
// 	var uri = data['uri'];

// 	var tr = $('<tr/>', {'data-rabid': data['rabid']}).css('vertical-align','baseline');
// 	var td_uri = $('<td/>').text(uri).css({'border-top':'1px solid black', 'padding-top': '8px'});
// 	var td_data = $('<td/>').css({'border-top':'1px solid black', 'padding-top': '8px'});
// 	var lst = $('<ul/>');
// 	$.each(targets, function (i, row) {
// 		var li = $('<li/>');				
// 		var prd = $('<span/>').text(row['predicate']);	
// 		var count = $('<span/>').text(row['subjects'].length);
// 		li.append(prd).append(count);
// 		lst.append(li);
// 	});
// 	$.each(pointers, function (i, row) {
// 		var li = $('<li/>');				
// 		var prd = $('<span/>').text(row['predicate']);	
// 		var count = $('<span/>').text(row['objects'].length);
// 		li.append(prd).append(count);
// 		lst.append(li);
// 	});
// 	td_data.append(lst);
// 	tr.append(td_uri).append(td_data);
// 	tbl.append(tr);
// };

// var removeMergeCandidate = function( rabid ) {
// 	var tbl = $('#merge-candidates');
// 	tbl.find(`tr[data-rabid='${rabid}']`).remove();
// };

// var resetView = function() {
// 	is_editing = false;

// 	$('#uri-display').empty();
// 	$('#label-display').empty();
// 	$('.pointers').empty();
// 	$('.properties').empty();
// 	$('#inspector').attr('data-rabid', '');
// 	$('#merge-candidates').empty();
// 	$('.selector-arrow').removeClass('selected editing');
// 	$('#reset-view').css('visibility', 'hidden');
// 	$('#merge-into input').css('visibility', 'hidden');
// };