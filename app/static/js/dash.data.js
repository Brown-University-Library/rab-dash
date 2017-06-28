dash.data = (function () {
	var
		configMap = {
			remote : 'http://localhost:5000/'
		},

		resource,

		configModule;

		resource = (function (){
			var
				list, merge, editLiteral;


			list = function( type_param ) {
				$.ajax({
					url: configMap.remote + 'selector',
					data: { 'type': type_param },
					success: function( data ) {
						$( window ).trigger( 'listQueryCompleted', data );
					}
				});
			};

			view = function( rabid ) {
				$.ajax({
					url: 'http://localhost:5000/explorer/' + rabid,
					success: function( data ) {
						$( window ).trigger( 'viewQueryCompleted', data );
					}
				});
			}

			merge = function( merge_target, resources_to_merge ) {
				$.ajax({
					url: configMap.remote + 'merge/',
					method: 'POST',
					dataType: 'json',
					contentType: "application/json",
					data: JSON.stringify(
						{ 'to_merge': resources_to_merge,
							'merge_into': merge_target }),
					success: function( data ) {
						$( window ).trigger( 'mergeRequestCompleted', data );
					}
				});
			};

			editLiteral = function (  ) {
				$.ajax({
					url: configMap.remote + 'triple-edit/',
					method: 'POST',
					dataType: 'json',
					contentType: "application/json",
					data: JSON.stringify(payload),
					success: function( data ) {
						console.log( data );
					}
				});
			}

			return {
				list : list,
				view : view,
				merge : merge,
				editLiteral : editLiteral
			}

		}());


		conifgModule = function ( config ) {
			configMap.remote = config['remote'];
		};

		return {
			conifgModule : conifgModule,
			resource : resource
		};
}());