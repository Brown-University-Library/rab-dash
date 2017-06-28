$('#merge-into').submit( function(e) {
	e.preventDefault();

	var merge_into = $('#inspector').attr('data-rabid');
	var selected = $('#selector-list .selected');

	var uris_to_merge = [];
	selected.each( function(i, slct) {
		var li = $( slct );
		uris_to_merge.push( li.attr("data-rabid") );
	});

	$.ajax({
		url: 'http://localhost:5000/merge/',
		method: 'POST',
		dataType: 'json',
		contentType: "application/json",
		data: JSON.stringify({ 'to_merge': uris_to_merge, 'merge_into': merge_into }),
		success: function( data ) {
			console.log( data );
		}
	});

});