var _ 		= require('underscore')._;
var util    = require('util');
var path    = require('path');
var fs 		= require('graceful-fs');
var exec    = require('child_process').exec;

var PluginInterface = null;

// Begin module definition here. You can alternatively just define
// this in a var and export that if you have OCD like that.
var Plugin = {

	// All plugins must implment the init function. This is the main entry
	// point by which you can set up your express app, setup any routes
	// you wish to service under this app's ReST namespace.
	//
	// init(callback) 		
	//		This is called by the framework while initially loading
	//		the plugin. Normally, if you want to just use ejs and 
	//		use the "default" public and views folders - then at this
	//		point just call into the PluginInterface, and ask it to
	// 		initialize express using the init_express function.
	// Inputs: callback - function to call once we are done. The function
	// 					  takes the form of function(error, app, description)
	//					  which are returned to the harness framework.
	init: function(interface, callback) {
		console.log('Initializing the Test Plugin');
		PluginInterface = interface;

		// Since we are lazy, use the "default" method to setup express
		// this will assume that we want to use ejs as the templating
		// engine, with the "public" and "views" containing the scripts 
		// and templates (respectively).
		// Note that we need to pass in the __dirname var here to tell 
		// the interface the paths to the client files.
		PluginInterface.init_express(__dirname, function(error, app) {
			if(error) callback(error, null);

			// Ok so we have an app, lets setup some routes which will
			// react to UI interactions
			Plugin.setup_express_routes(app);

			// Routes seemed to be setup ok, lets return the app to
			// the framework so it can add us to its possible clients
			callback(error, app, [
				'Test Plugin: This plugin is used to demonstrate how',
				'easy it is to add a new plugin to the PC Minion framework.',
				'This is a placeholder description to return back to the app.'
			].join(' '));
		});
	},

	// setup_express_routes(app)
	//		This function just sets up any express routes we want to service
	//		Configure your ReSTy stuff here. This is an internal function,
	// 		feel free to make it take an additional function callback as a
	// 		param if you need this to be done asyncly
	setup_express_routes: function(app) {

		// Note that any routes configured here are namespaced by this plugins
		// folder name. For instance since this is the "Test" plugin, when you
		// define a route for / you really are defining a route to:
		// localhost:PORT#/Test/

		// GET /
		// All plugins which wish to show a UI must implement this route.
		// The default "view" is Index.js which normally resides in the
		// views folder. However, you are free to call this whatever you want.
		app.get('/', function(request, response) {
			response.render('Index');
		});

		// GET /1
		app.get('/1', function(request, response) {
			console.log('Got /Test/1');
			PluginInterface.run_ahk_script('Run www.google.com', '', function(error) {
				response.send('1');
			});
		});

		// GET /2
		app.get('/2', function(request, response) {
			console.log('Got /Test/2');
			response.send('2');
		});

		// GET /3
		app.get('/3', function(request, response) {
			console.log('Got /Test/3');
			response.end();
		});
	}
};

module.exports = Plugin;