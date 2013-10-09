var _ 		= require('underscore')._;
var util    = require('util');
var path    = require('path');
var fs 		= require('graceful-fs');
var exec    = require('child_process').exec;


// Global settings from the "app"
var _settings = null;

var express = require('express');
var app = express();

var Plugin = {
};

// Any plugin must implement the following functions:
// init and get_app, where get_app returns an instance of the
// express app running for this plugin.
Plugin.init = function(global_settings) {
	console.log('A Plugin Init called');
	_settings = global_settings;

	// Instatiate express app
	this.setup_express_server();

	this.setup_routes();
}

Plugin.get_app = function() {
	return app;
}

// Helper function to setup the express server
// TODO: Make this generic so its done for free, unless the 
// plugin wants to customize its definition
Plugin.setup_express_server = function() {
	app.configure(function() {
		app.use(express.static(path.join(__dirname, 'public')));
		app.set('view options', {layout: false});
		app.set('view engine', 'ejs');
		app.set('trust proxy', true);
		app.set('views', path.join(__dirname, 'views'))
	});
}

// Setup any routes for this plugin
Plugin.setup_routes = function() {
	// GET /
	app.get('/', function(request, response) {
		console.log(__dirname);
		console.log('Computer manager @ GET /');
		response.render('Index');
	});

	// GET /shutdown
	app.get('/shutdown', function(request, response) {
		console.log(__dirname);
		console.log('Computer manager @ GET /shutdown');
		response.send('SHUTDOWN');
		exec('shutdown -s -t 3');
	});

	// GET /restart
	app.get('/restart', function(request, response) {
		console.log(__dirname);
		console.log('Computer manager @ GET /restart');
		response.send('RESTART');
		exec('shutdown -r -t 3');
	});
}

module.exports = Plugin;
