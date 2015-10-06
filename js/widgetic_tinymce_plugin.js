(function() {
	var widgetic = 'widgetic', 
		media = wp.media,
		shortcode_widgetic = 'widgetic',
		shortcode_string = 'widgetic',
		myButton = null,
		saveToken = function(token) {
			widgeticAuthToken = token.accessToken;
		},
		tryAuth = function(){
			return Widgetic.auth(false, ['account_details']).then(saveToken);
		};
	var	frame;
	if(apiKey.length > 0) {
		Widgetic.init(
			apiKey,
			basePath+'/wp-content/plugins/widgetic/assets/wdtc-proxy.html'
		);
		tryAuth();
	}



	tinymce.PluginManager.add(widgetic, function( editor ) {
		// Add a button that opens a window
		editor.addButton(widgetic, {
			title: 'Widgetic',
			icon: 'icon widgetic-own-icon',
			onclick:  function(){
				widgeticBox(null);
			}
		});

		function widgeticBox(opts){
			if(apiKey.length && widgetic_refresh_token.length) {
				if(!widgeticAuthToken) {
					return tryAuth().then(widgeticBox);
				}

				popup = editor.windowManager.open( {
					title: 'Widgetic',
					width: window.innerWidth-60,
					height: window.innerHeight-60-37,
					resizable: true,
					buttons: []
				});
				var showPlugin = wigetic_plugin.bind(null, jQuery('#'+popup._id+'-body')[0], opts);
				showPlugin()
			} else {
				window.location.href="admin.php?page=widgetic/includes/widgetic_settings.php"
			}
		}

		function loadMediaContent(plugin, opts) {
			jQuery.ajax({
				url: basePath + '/wp-admin/admin-ajax.php',
				type: 'POST',
				dataType: 'json',
				cache: true, 
				data: {
					action: 'getMedia',
					test: '1234532', 
					type: opts['content-type'][0]
				}
				
			}).success(function(data) {
			 	plugin.addEditorContent({
					editorId: opts.editorId,
					source: opts.source.toLowerCase(),
					data: data
				});
			});
		}

		function openMedia (plugin, opts) {
			if ( frame ) {
				frame.open();
				return;
			}
			frame = wp.media.frames.frame = wp.media({
				multiple: 'add',
				library : { type: opts['content-type'][0]},	
			});

			frame.on('select', function(){
				var selection = frame.state().get('selection');
				var attachments = selection.map( function( attachment ) {
					attachment = attachment.toJSON();
					return {
						'id': attachment.id,
						'name' : attachment.title, 
						'url'  : attachment.url,
						'type': opts['content-type'][0]
					}
				});

			 	plugin.addEditorContent({
					editorId: opts.editorId,
					source: opts.source.toLowerCase(),
					data: attachments
				});
			});

			frame.open();
		}

		function insertWidget(opts) {
			var s = '[' + widgetic;
			for (var p in opts) {
				if (opts.hasOwnProperty(p)) {
					s += ' ' +  p + '=\'' + opts[p] + '\'';
				}
			}
			s += ']';
			s += '[/' + widgetic + ']';
			editor.insertContent(s);

			editor.windowManager.close();
		} 

		function wigetic_plugin(body, opts){
			var loaded = false;
			if(opts){opts.resizeMode = opts.resizemode;}

			var plugin = Widgetic.UI.plugin.create({
				holder: body,
				composition: opts,
				editor: {
					sources: {
						wordpress: {
							options: {
								pos: 2,
								icon: window.location.origin+'/wp-content/plugins/widgetic/images/wordpress.png',
								colors: {light: '#517fa6', dark: '#497295 '},
								connectButton: {label: 'Wordpress'}
							}
						}
					}
				},
			})
			.on('embed', function(opts){
				console.log('Plugin notify embed: ', opts);
				insertWidget(opts)
				plugin.close();
			})
			.on('open-library', function(opts){
				console.log('Plugin notify embed: ', opts);
				if(!loaded){
					loadMediaContent(plugin, opts);
					loaded = true;
				}
				if(opts.interactive) {
					openMedia(plugin, opts)
				}
			})
			.on('close', function(){
				console.log('Plugin notify closed');
			});
		}
		

		wp.mce.widgetic_view = {
			shortcode_data: {},
			template: media.template('editor-widgetic_view' ),
			getContent: function() {
					var options = this.shortcode.attrs.named;
					return this.template(options);
			},
			View: {
				// before WP 4.2:
				template: media.template( 'editor-widgetic_view' ),
				postID: jQuery('#post_ID').val(),
				initialize: function( options ) {
					this.shortcode = options.shortcode;
					wp.mce.widgetic.shortcode_data = this.shortcode;
				},
				getHtml: function() {
					var options = this.shortcode.attrs.named;
					return this.template(options);
				}
			}, 
			edit: function( data, update) {
				var shortcode_data = wp.shortcode.next(shortcode_string, data);
				var values = shortcode_data.shortcode.attrs.named;
				widgeticBox(values)
				
			},

		};
		wp.mce.views.register(shortcode_widgetic, wp.mce.widgetic_view);
		
	});
	
})();