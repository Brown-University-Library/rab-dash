var showSelectList = function(data) {
	var slc_list = $("#selector-list");
	slc_list.empty();

	var jdata = JSON.parse(data);
	$.each(jdata, function(i, row) {
		var li = $('<li/>', { 'class': 'selector-arrow',
							'data-rabid': row['rabid']});
		var label = $('<div/>', {'class': 'item-label'})
						.text(row['label']);
		var edit_box = $('<div/>', {'class': 'editing-box'});
		var edit_btn = $('<button/>', {'class': 'enable-editing',
										'html': '&plus;'});
		edit_box.append(edit_btn);
		li.append(label).append(edit_box);
		slc_list.append(li);
	});

	$('.item-label').click( function() {
		var $li = $(this).closest('li');

		if (is_editing === false) {
			if ( $li.hasClass('selected') ) {
				$('.selector-arrow').removeClass('selected');
			}
			else {
				$('.selector-arrow').removeClass('selected');
				$li.addClass('selected');
				var rabid = $li.attr('data-rabid');
				$.ajax({
					// dataType: "json",
					url: 'http://localhost:5000/explorer/' + rabid,
					success: function( data ) {
						showDetails( data );
					}
				});
			}
		}
		else {
			if ( $li.hasClass('selected') ) {
				$li.removeClass('selected');
				removeMergeCandidate($li.attr('data-rabid'));
			}
			else if ( $li.hasClass('editing') ) {
					return true;
			}
			else {
				$li.addClass('selected');
				var rabid = $li.attr('data-rabid');
				$.ajax({
					// dataType: "json",
					url: 'http://localhost:5000/explorer/' + rabid,
					success: function( data ) {
						addMergeCandidate( data );
					}
				});
			}
			
		}
	});

	$('.enable-editing').click( function(e) {
		e.preventDefault();

		is_editing = true;

		$('.selector-arrow').removeClass('selected editing');

		$li = $(this).closest('li');
		$li.removeClass('selected').addClass('editing');

		var rabid = $li.attr('data-rabid');
		$.ajax({
			// dataType: "json",
			url: 'http://localhost:5000/explorer/' + rabid,
			success: function( data ) {
				editDetails( data );
			}
		});
	});
};