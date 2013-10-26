var _ 		= require('underscore')._;
var util    = require('util');
var path    = require('path');
var fs 		= require('graceful-fs');
var exec    = require('child_process').exec;

var PluginInterface = require('./../../PluginInterface.js');

var Plugin = {

	// Default init - calls super init
	init: function(callback) {
		console.log('Initializing the DesktopManagement plugin');

		// Init the plugin by calling the super init
		PluginInterface.init_express(__dirname, function(error, app) {
			if(error) callback(error, null);

			Plugin.setup_routes(app);

			callback(error, app, [
				'Desktop Management is a plugin which allows you to do things',
				'like shutdown, restart control system volume, kill tasks,',
				'run remote commands and more'
			].join(' '));
		});
	},

	// Custom routes for this plugin
	setup_routes: function(app) {
		console.log('Setting up routes for the DesktopManagement Plugin');

		// GET /
		app.get('/', function(request, response) {
			console.log('Computer manager @ GET /');
			response.render('Index');
		});

		// GET /shutdown
		app.get('/shutdown', function(request, response) {
			console.log('Computer manager @ GET /shutdown');
			response.send('SHUTDOWN');
			exec('shutdown -s -t 3');
		});

		// GET /restart
		app.get('/restart', function(request, response) {
			console.log('Computer manager @ GET /restart');
			response.send('RESTART');
			exec('shutdown -r -t 3');
		});

		app.post('/move_mouse', function(request, response) {
			console.log('Computer manager @ POST /move_mouse');
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
			console.log('Computer manager @ POST /left_click');
			PluginInterface.run_ahk_script('Click', '', function(error, stderr) {
				response.send('OK');
			});
		});

		app.post('/right_click', function(request, response) {
			console.log('Computer manager @ POST /right_click');
			PluginInterface.run_ahk_script('Click right', '', function(error, stderr) {
				response.send('OK');
			});
		});

		app.post('/double_click', function(request, response) {
			console.log('Computer manager @ POST /double_click');
			PluginInterface.run_ahk_script('Click 2', '', function(error, stderr) {
				response.send('OK');
			});
		});

		app.post('/send_keys', function(request, response) {
			console.log('Computer manager @ POST /right_click');
			var data = '';
			request.on('data', function(chunk) {
				data += chunk;
			}).on('end', function() {
				PluginInterface.run_ahk_script('Send ' + data, '/f', function(error, stderr) {
					response.send('OK');
				});
			});
		});
	},
};

module.exports = Plugin;