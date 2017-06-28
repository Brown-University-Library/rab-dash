$('#filter-selector-list').submit( function(e) {
	e.preventDefault();

	var type_param = $(this).find('#filter-type option:selected')
						.attr('value');

	$.ajax({
		url: 'http://localhost:5000/selector',
		data: { 'type': type_param },
		success: function( data ) {
			showSelectList( data );
		}
	});

});

$('#list-controls').submit( function(e) {
	e.preventDefault();

	var type_param = 'controls';

	$.ajax({
		url: 'http://localhost:5000/selector',
		data: { 'type': type_param },
		success: function( data ) {
			showControlList( data );
		}
	});

});