var _ 		= require('underscore')._;
var util    = require('util');
var path    = require('path');
var fs 		= require('graceful-fs');
var os 		= require('os');

var Async   = require('async');

// Custom console overload
var Console = require('./Console.js');

// Global settings, normally this is configured on first
// use of server
var _settings = {
	url: 'http://' + os.hostname(),
	port: 1234
}

// Keep track of any plugins which we have actually
// loaded, this way we know how to redirect each of them
// to their corresponding landing pages
var loaded_plugins = [];

// Setup express
var express = require('express');
var app = express();

// Setup server and start listening for stuff
Async.series([

	// 1. Configure the express app, setup any view / layout settings,
	// 	  setup the public folder for express and tell it to use ejs for 
	// 	  templating (this is only for the 'main' landing page)
	function configure_express(next_function) {
		app.configure(function() {
			app.use(express.static(path.join(__dirname, 'public')));
			app.set('view options', {layout: false});
			app.set('view engine', 'ejs');
			app.set('trust proxy', true);
			app.set('views', path.join(__dirname, 'views'))
			next_function();
		});
	},

	// 2. Setup the routes for the main page
	function configure_routes(next_function) {
		setup_application_routes(next_function);
	},

	// 3. Setup the routes for the dynamic set of plugins we have
	function configure_plugin_routes(next_function) {
		setup_plugin_routes(next_function);
	}

], function(error) {
	if(error) {
		Console.error('Unable to initialize the server.', error);
		Console.log('Terminating server...');
		process.exit(1);
	}
	else {
		// Listen on our port of choice
		app.listen(_settings.port);
	}
});


// Setup any routes that the main application must fulfil, any other ones
// which are plugin specific will be loaded by each plugin
function setup_application_routes(callback) {

	// GET / - Home page for application
	app.get('/', function(request, response) {
		Console.debug('Main app GET /');
		response.render('Index', {
			settings: _settings,
			plugins: loaded_plugins
		});
	});

	callback();
}


// Setup any routes dynamically based on what we have in the plugins folder
function setup_plugin_routes(callback) {
	var plugin_dir = path.join(__dirname, 'plugins');

	Async.waterfall([
		// Walk all dirs in ./plugins
		function walk_plugin_dir(next_function) {
			fs.readdir(plugin_dir, next_function);
		},

		// Add each one to the app if it has an Index.js file
		function load_plugins(plugins, next_function) {
			var parallel_fns = _.map(plugins, function(plugin_name) {
				return function(parallel_fn_callback) {
					var plugin_file = path.join(plugin_dir, plugin_name, 'Index.js');
					Console.debug('Checking plugin file: ' + plugin_file);

					// Check for existence of plugin, if its present - then load it
					// so we can wire up its http routes.
					fs.exists(plugin_file, function(plugin_exists) {
						if(plugin_exists) {
							Console.debug('Loaded plugin: ' + plugin_name);
							// Load the plugin
							var plugin = require(plugin_file);

							// Init, pass global settings object to plugin
							plugin.init(_settings);

							// Add it to the successfully loaded plugin list
							loaded_plugins.push(plugin_name);

							// Bind this plugins namespace to its corresponding
							// app so it will handle all its own HTTP routing
							app.use('/' + plugin_name, plugin.get_app());
						}
						// Done with parallelizable work
						parallel_fn_callback();
					});
				};
			});
			Async.parallel(parallel_fns, function(error) {
				if(error) Console.error('Unable to load plugins', error);
				next_function(error);
			});
		},
	], function(error) {
		if(error) Console.error('Unable to setup plugin routes', error);
		callback(error);
	});
}
