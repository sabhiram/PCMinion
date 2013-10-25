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

		app.get('/beep', function(request, response) {
			console.log('Computer manager @ GET /beep');
			response.redirect('/DesktopManagement');
		});
	},
};

module.exports = Plugin;