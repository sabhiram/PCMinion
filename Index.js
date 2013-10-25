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
							Console.debug('\nLoaded plugin: ' + plugin_name);
							
							// Load the plugin
							load_plugin(plugin_name, plugin_file, app, parallel_fn_callback);

							// DISABLED CODE // DISABLED CODE // DISABLED CODE // DISABLED CODE
							// Potentially explore auto-restarting the server / plugin as and
							// when it changes. This is probably easiest w/ something like
							// nssm or supervisor for node.
							// // Setup a watch on this plugin so we can reload it
							// var plugin_path = path.join(plugin_dir, plugin_name);
							// fs.watch(plugin_path, function(event, filename) {
							// 	if(filename && filename.match(/^.*\.js$/)) {
							// 		Console.log('Event: ' + event + ' @File: ' + filename);
							// 		load_plugin(plugin_name, plugin_file, app, function(error) {
							// 			console.log(app.routes);
							// 		});
							// 	}
							// });
							// DISABLED CODE // DISABLED CODE // DISABLED CODE // DISABLED CODE
						}
						else parallel_fn_callback();
					});
				};
			});
			
			// The above map only defines the would be || functions, run them
			// as part of this step in this waterfall of initial actions...
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

function load_plugin(plugin_name, plugin_file, app, callback) {
	Console.debug('Loading plugin:');
	Console.debug('    Name 		- ' + plugin_name);
	Console.debug('    FileName 	- ' + plugin_file);

	var Plugin = require(plugin_file);
	Plugin.init(function(error, plugin_app, plugin_description) {
		if(typeof(plugin_description) == 'undefined') {
			plugin_description = 'No description for this plugin, bad developer!';
		}
		if(error) {
			Console.debug('Error loading plugin: ' + error);
			// Skip this plugin...
			callback();
		}
		else if(typeof(plugin_app) == 'undefined') {
			var app_error = 'The ' + plugin_name + ' plugin returned a null app!'; 
			Console.debug(app_error);
			// Skip this plugin too...
			callback();
		}
		else {
			if(_.contains(loaded_plugins, plugin_name) == false) {
				// Add it to the successfully loaded plugin list
				loaded_plugins.push({
					name: plugin_name,
					description: plugin_description
				});

				// If this has an icon, pull it into the main app's
				// public folder
				var icon_file = path.join(__dirname, 'plugins', plugin_name, 'icon.png');
				copy_icon_to_dynamic_dir(icon_file, plugin_name);
			}

			// Bind this plugin's namespace to its corresponding
			// app so it will handle all its own HTTP routing
			app.use('/' + plugin_name, plugin_app);

			// Done with this unit of work
			callback();
		}
	});
}

function copy_icon_to_dynamic_dir(icon_file, plugin_name, callback) {
	var dynamic_dir = path.join(__dirname, 'public', '_dynamic');
	var dst_file = path.join(dynamic_dir, plugin_name + '.png');
	
	Async.series([
		// Setup the path for the image in case the plugin does
		// not provide an icon
		function setup_source_path(next_step) {
			fs.exists(icon_file, function(exists) {
				if(!exists) {
					icon_file = path.join(__dirname, 'default.png');
				}
				next_step();
			});
		},
		// Make the dynamic dir in case it does not exist...
		function make_dynamic_dir(next_step) {
			fs.mkdir(dynamic_dir, function(error) {
				// Ignore the error in case it already exists...
				next_step();
			});
		},
		// Delete the dst file if its there...
		function delete_destination_image(next_step) {
			fs.exists(dst_file, function(exists) {
				if(exists) {
					Console.log('Deleting file ' + dst_file);
					fs.unlink(dst_file, next_step);
				}
				else next_step();
			});
		},
		// Move this file into the dynamic dir
		function move_file_to_dir(next_step) {
			var input_stream = fs.createReadStream(icon_file);
			var output_stream = fs.createWriteStream(dst_file);
			input_stream.pipe(output_stream);
		}
	], function(error) {
		if(error) Console.error('Unable to copy icon to dynamic dir. Error: ' + error);
		if(typeof(callback) == 'function') callback(error);
	});
}