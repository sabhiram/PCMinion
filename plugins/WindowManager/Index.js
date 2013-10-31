var _ 		= require('underscore')._;
var util    = require('util');
var path    = require('path');
var fs 		= require('graceful-fs');
var exec    = require('child_process').exec;
var Async 	= require('async');

var PluginInterface = null;
var Profiles = null;

var Plugin = {

	// Default init - calls super init
	init: function(interface, callback) {
		console.log('Initializing the WindowManager plugin');
		PluginInterface = interface;
		var profile_file = path.join(__dirname, 'profiles.json');
		Async.waterfall([
			// Load profile var...
			function load_profile_json(next_function) {
				fs.readFile(profile_file, 'utf-8', function(error, data) {
					if(error) {
						Profiles = {};
						fs.writeFile(profile_file, '{}', 'utf-8', next_function);
					}
					else {
						Profiles = JSON.parse(data);
						next_function();
					}
				});
			},
			// Initialize the plugin's express app using the 
			// global interface
			function initialize_app(next_function) {
				// Init the plugin by calling the super init
				PluginInterface.init_express(__dirname, function(error, app) {
					if(error) next_function(error);
					else {
						Plugin.setup_routes(app);
						next_function(error, app)
					}
				});
			},
		], function(error, app) {
			callback(error, app, [
				'The WindowManager is a simple plugin which uses AHK on the backend',
				'to do basic window management. You can easily save multiple different',
				'window layouts, and save / restore them at the click of a button.',
				'Enhance your keyboard by using your phone\'s screen as window management',
				'virtual buttons!'
			].join(' '));
		});
	},

	// Custom routes for this plugin
	setup_routes: function(app) {
		console.log('Setting up routes for the RemoteMouse Plugin');

		// GET /
		app.get('/', function(request, response) {
			console.log('WindowManager @ GET /');
			var p = [];
			for(key in Profiles) {
				p.push(key);
			}
			response.render('Index', {
				profiles: p,
			});
		});

		app.post('/minimize_all', function(request, response) {
			PluginInterface.run_ahk_script('WinMinimizeAll', '', function(error, stderr) {
				response.send('OK');
			});
		});

		app.post('/un_minimize_all', function(request, response) {
			PluginInterface.run_ahk_script('WinMinimizeAllUndo', '', function(error, stderr) {
				response.send('OK');
			});
		});

		app.post('/toggle_desktop', function(request, response) {
			PluginInterface.run_ahk_script('Send #d', '', function(error, stderr) {
				response.send('OK');
			});
		});

		app.post('/save_profile', function(request, response) {
			var data = '';
			request.on('data', function(chunk) {
				data += chunk;
			}).on('end', function() {
				var profile_request = JSON.parse(data);
				var profile_name 	= profile_request['name'];
				var script_path 	= path.join(__dirname, 'scripts', 'get_current_window_positions.ahk');
				var csv_file    	= path.join(__dirname, 'scripts', 'window_positions.txt');
				var profile_path    = path.join(__dirname, 'profiles.json');
				var profile = {
					name: profile_name,
					windows: []
				};

				Async.waterfall([
					// 1. Verify script exists
					function verify_script(next_function) {
						fs.exists(script_path, function(exists) {
							if(!exists) {
								var error = 'Unable to find save window position script!';
								console.log(error);
								next_function(error);
							}
							else next_function();
						});
					},
					// 2. Run the AHK script to get window positions...
					function run_ahk_script(next_function) {
						exec(script_path, function(error, stdout, stderr) {
							//console.log('StdOut: ' + stdout);
							//console.log('StdErr: ' + stderr);
							next_function(error);
						});
					},
					// 3. Read the generated file
					function read_csv_file(next_function) {
						fs.readFile(csv_file, 'utf-8', function(error, data) {
							next_function(error, data);
						});
					},
					// 4. Parse it into our json file
					function store_json_file(data, next_function) {
						var lines = data.split('\r\n');
						for(idx in lines) { 
							var line_arr = _.map(lines[idx].split(','), function(item) {return item.trim();});
							if(line_arr.length > 1) {
								var o = _.object(['id','title', 'class', 'x', 'y', 'width', 'height', 'state'], line_arr);
								if(o['title'].match(/Progman/)) {
									// ignore list
								}
								else {
									profile.windows.push(o);
								}
							} 
						}
						Profiles[profile_name] = profile;

						// Save off profile..
						fs.writeFile(profile_path, JSON.stringify(Profiles, null, 4), 'utf-8', next_function);
					},
					// 5. Delete the temp file..
					function delete_position_csv_file(next_function) {
						fs.unlink(csv_file, next_function);
					}
				], function(error) {
					if(error) {
						console.log('Unable to process save window profile request. Error: ' + error);
						response.send({'error': error});
					}
					else {
						response.send({'result': 'success'});
					}
				});
			});
		});

		app.post('/load_profile', function(request, response) {
			var data = '';
			request.on('data', function(chunk) {
				data += chunk;
			}).on('end', function() {
				var profile_request = JSON.parse(data);
				var profile_name 	= profile_request['name'];
				var profile_path    = path.join(__dirname, 'profiles.json');
				var script_path 	= path.join(__dirname, 'scripts', 'restore_window.ahk');
				Async.waterfall([
					// 0. Minimize all windows... TODO: This is needed so
					// new windows will be hidden away....
					// function minimize_all(next_function) {
					// 	PluginInterface.run_ahk_script(['SetWinDelay, -1','Send, #d'].join('\r\n'), '', function(error, stderr) {
					// 		next_function();
					// 	});
					// },
					// 1. Load the profile..
					function load_profile(next_function) {
						fs.readFile(profile_path, next_function);
					},
					// 2. Parse it...
					function parse_profile(data, next_function) {
						console.log('Loaded profile');
						var profiles = JSON.parse(data);
						var profile = profiles[profile_name];

						var parallel_functions = _.map(profile.windows.reverse(), function(item) {
							return function(callback) {
								var state = ( item.state > 0 ) ? 'max' : ( item.state < 0 ) ? 'min' : '';
								exec([script_path, item.id, item.x, item.y, item.width, item.height, state].join(' '), function(error, stdout, stderr) {
									//console.log('StdOut: ' + stdout);
									//console.log('StdErr: ' + stderr);
									callback(error);
								});
							};
						});
						Async.parallel(parallel_functions, function(error) {
							console.log('Done w/ parallel functions for window restore');
							next_function(error);
						});
					}
				], function(error) {
					if(error) {
						console.log('Unable to process load window profile request. Error: ' + error);
						response.send({'error': error});
					}
					else {
						response.send({'result': 'success'});
					}
				});
			});
		});

		app.post('/delete_profile', function(request, response) {
			var data = '';
			request.on('data', function(chunk) {
				data += chunk;
			}).on('end', function() {
				var profile_request = JSON.parse(data);
				var profile_name 	= profile_request['name'];
				var profile_path    = path.join(__dirname, 'profiles.json');

				Async.waterfall([
					// 1. Load the profile..
					function load_profiles(next_function) {
						fs.readFile(profile_path, next_function);
					},
					// 2. Parse it...
					function delete_profile(data, next_function) {
						console.log('Loaded profile');
						var profiles = JSON.parse(data);
						delete Profiles[profile_name];
						// Save off profile..
						fs.writeFile(profile_path, JSON.stringify(Profiles, null, 4), 'utf-8', next_function);
					}
				], function(error) {
					if(error) {
						console.log('Unable to process load window profile request. Error: ' + error);
						response.send({'error': error});
					}
					else {
						response.send({'result': 'success'});
					}
				});
			});
		});
	},
};

module.exports = Plugin;