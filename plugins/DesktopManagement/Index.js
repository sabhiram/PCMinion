var _ 		= require('underscore')._;
var util    = require('util');
var path    = require('path');
var fs 		= require('graceful-fs');
var exec    = require('child_process').exec;

var PluginInterface = require('./../../PluginInterface.js');

var DesktopManagement = {

	m_app: null,

	// Default init - calls super init
	init: function(callback) {
		console.log('DesktopManagement:: init');

		// Init the plugin by calling the super init
		PluginInterface.init_express(__dirname, function(error, app) {
			DesktopManagement.m_app = app;
			DesktopManagement.setup_routes();
			callback(error);
		});
	},

	// return the app instance to the framework
	get_app: function() {
		return DesktopManagement.m_app;
	},

	// Custom routes for this plugin
	setup_routes: function() {
		console.log('DesktopManagement:: setup_routes');

		var app = DesktopManagement.m_app;

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

module.exports = DesktopManagement;