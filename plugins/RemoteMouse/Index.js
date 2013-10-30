var _ 		= require('underscore')._;
var util    = require('util');
var path    = require('path');
var fs 		= require('graceful-fs');
var exec    = require('child_process').exec;

var PluginInterface = null;
var Plugin = {

	// Default init - calls super init
	init: function(interface, callback) {
		console.log('Initializing the RemoteMouse plugin');
		PluginInterface = interface;

		// Init the plugin by calling the super init
		PluginInterface.init_express(__dirname, function(error, app) {
			if(error) callback(error, null);

			Plugin.setup_routes(app);

			callback(error, app, [
				'RemoteMouse is a plugin which allows you to control your mouse',
				'remotely from any other touch enabled device like your phone, or tablet.',
				'It Supports inputs like click, double click, right click. The plugin also',
				'comes with a basic keyboard input where you can type and send keys to the machine',
				'being controlled. This plugin uses Hammer.js (globally available to all plugins)',
				'which is an awesome multi-touch JS library (Check it out',
				'<a target="_blank" href="http://eightmedia.github.io/hammer.js/">here</a>).'
			].join(' '));
		});
	},

	// Custom routes for this plugin
	setup_routes: function(app) {
		console.log('Setting up routes for the RemoteMouse Plugin');

		// GET /
		app.get('/', function(request, response) {
			console.log('Remote Mouse @ GET /');
			response.render('Index');
		});

		// GET /shutdown
		app.get('/shutdown', function(request, response) {
			console.log('Remote Mouse @ GET /shutdown');
			response.send('SHUTDOWN');
			exec('shutdown -s -t 3');
		});

		// GET /restart
		app.get('/restart', function(request, response) {
			console.log('Remote Mouse @ GET /restart');
			response.send('RESTART');
			exec('shutdown -r -t 3');
		});

		app.post('/move_mouse', function(request, response) {
			console.log('Remote Mouse @ POST /move_mouse');
			var data = '';
			request.on('data', function(chunk) {
				data += chunk;
			}).on('end', function() {
				var xy_delta = JSON.parse(data);
				//console.log(util.inspect(xy_delta));
				var cmd = 'MouseMove, ' + xy_delta['x_delta'] + ', ' + xy_delta['y_delta'] + ', 2, R';
				console.log('CMD: ' + cmd);
				PluginInterface.run_ahk_script(cmd, '/f', function(error, stderr) {
					response.send(stderr);
				});
			});
		});

		app.post('/left_click', function(request, response) {
			console.log('Remote Mouse @ POST /left_click');
			PluginInterface.run_ahk_script('Click', '', function(error, stderr) {
				response.send('OK');
			});
		});

		app.post('/right_click', function(request, response) {
			console.log('Remote Mouse @ POST /right_click');
			PluginInterface.run_ahk_script('Click right', '', function(error, stderr) {
				response.send('OK');
			});
		});

		app.post('/double_click', function(request, response) {
			console.log('Remote Mouse @ POST /double_click');
			PluginInterface.run_ahk_script('Click 2', '', function(error, stderr) {
				response.send('OK');
			});
		});

		app.post('/send_keys', function(request, response) {
			console.log('Remote Mouse @ POST /send_keys');
			var data = '';
			request.on('data', function(chunk) {
				data += chunk;
			}).on('end', function() {
				PluginInterface.run_ahk_script('Send ' + data, '/f', function(error, stderr) {
					response.send('OK');
				});
			});
		});

		app.post('/scroll', function(request, response) {
			console.log('Remote Mouse @ POST /scroll');
			var sensitivity = 10.0;
			var data = '';
			request.on('data', function(chunk) {
				data += chunk;
			}).on('end', function() {
				var scroll_object = JSON.parse(data);
				if(scroll_object.scroll > 0) {
					var s = '';
					for(var i = 0; i <= scroll_object.scroll / sensitivity; i++) { s += '{WheelDown}'}
					PluginInterface.run_ahk_script('Send, ' + s, '/f', function(error, stderr) {
						response.send('OK');
					});
				}
				else if(scroll_object.scroll < 0){
					var s = '';
					for(var i = 0; i <= -scroll_object.scroll / sensitivity; i++) { s += '{WheelUp}'}
					PluginInterface.run_ahk_script('Send, ' + s, '/f', function(error, stderr) {
						response.send('OK');
					});
				}
				else response.send('OK');
				
			});
		});
	},
};

module.exports = Plugin;