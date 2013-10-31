var _ 				= require('underscore')._;
var util    		= require('util');
var path    		= require('path');
var fs 				= require('graceful-fs');
var request 		= require('request');
var exec    		= require('child_process').exec;
var Async 			= require('async');

var PluginInterface = null;

var Plugin = {
	vlc_version: null,
	vlc_path: null,
	is_running: false
};


// Init
Plugin.init = function(interface, callback) {
	console.log('Initializing VLC Plugin');
	PluginInterface = interface;

	// Init the plugin by calling the super init
	PluginInterface.init_express(__dirname, function(error, app) {
		if(error) callback(error, null);
		else {
			Async.series([
				// Initialize VLC
				function init_vlc(next_function) {
					Plugin.init_vlc_info(next_function);
				},
				// Load application routes
				function load_http_routes(next_function) {
					Plugin.setup_routes(app);
					next_function();
				}
			], function(error) {
				callback(error, app, [
					'VLC Plugin can be used to do things like installing, updating',
					'and controlling VLC on your PC. This is particularly usefull',
					'when your tv is connected to the same PC.'
				].join(' '));
			});
		}
	});
}

// Custom routes for this plugin
Plugin.setup_routes = function(app) {
	console.log('Setting up VLC routes');

	// GET /
	app.get('/', function(request, response) {
		console.log('VLC @ GET /');
		response.render('vlc');
	});

	// GET /
	app.get('/open', function(request, response) {
		console.log('VLC @ GET /open');
		if(Plugin.m_exe_path == null) {
			console.log('Exe is not defined - error!');
			response.send('Error - exe is not defined');
		}
		else {
			// Spawn VLC
			var cmd = '"' + Plugin.m_exe_path + '" --extraintf="http" --http-port="12346"';
			console.log(cmd);
			exec(cmd, function(error, stdout, stderr) {
				console.log('stdout: ' + stdout);
			    console.log('stderr: ' + stderr);
			    if (error !== null) {
			      console.log('exec error: ' + error);
			    }
			});
			response.redirect('http://effervescence:12346/');
		}
	});

	app.post('/volume_up', function(request, response) {
		request.get('http://localhost:12346/status.xml')
	});

	app.post('/volume_down', function(request, response) {
		console.log('VLC Volume UP');
		PluginInterface.run_ahk_script('Send ^{Down}', '', function(error, stderr) {
			response.send('ok');
		});
	});
}

// Setup VLC paths so we can launch it etc
Plugin.init_vlc_info: function(callback) {
	callback();
}

module.exports = Plugin;