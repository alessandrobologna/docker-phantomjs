var port, server, service, system = require('system');
if (system.args.length !== 2) {
	console.log('Usage: phantom-render.js <portnumber>');
	phantom.exit(1);
} else {
	port = system.args[1];
	server = require('webserver').create();
	service = server.listen(port, function(request, response) {
		if (request.method='POST') {
			console.log('Request at ' + new Date());
			console.log(JSON.stringify(request, null, 4));
			response.statusCode = 200;
			var page = require('webpage').create();
			
			page.viewportSize = {
				width : request.post.width ? request.post.width : 1280,
				height : request.post.height ? request.post.height : 768
			};
			if (request.post.format!=='jpeg') {
				// speed up the page loading
				page.settings.loadImages = false;
				page.onLoadStarted = function() {
			      //  page.navigationLocked = true;
			    };
				page.onResourceRequested = function(requestData, networkRequest) {
				    if ((/^data:.+|.+\/.+\.(css|woff|otf)(\?.+)?/gi).test(requestData['url'])) {
				        if (request.post.debug) {
				        	console.log('The url of the request is matching. Aborting: ' + requestData['url']);
				        }
				        request.abort();
				    } else {
				        if (request.post.debug) {
				        	console.log('Request (#' + requestData.id + '): ' +requestData.url);
				        }
				    }
				}
			}
			page.settings.resourceTimeout = 1000;
			page.open(request.post.url, function(status) {
				if (status !== 'success') {
					console.log('Unable to load the address! ' + address);
				} else {
					window.setTimeout(function() {
			
						if ('jpeg'===request.post.format) {
							response.headers = {
								'Content-Type' : 'text/plain'
							};						
							response.write(page.renderBase64('JPEG'));
						} else {
							response.headers = {
								'Content-Type' : 'text/html'
							};					
							response.write(page.content);
						}
						response.close();
						page.close();
					}, request.post.timeout ? request.post.timeout : 5000);
				}
			});
		}
	});
	if (service) {
		console.log('Web server running on port ' + port);
	} else {
		console.log('Error: Could not create web server listening on port '
				+ port);
		phantom.exit();
	}
}