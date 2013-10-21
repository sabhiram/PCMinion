var _ 				= require('underscore')._;
var util    		= require('util');
var path    		= require('path');
var fs 				= require('graceful-fs');
var exec    		= require('child_process').exec;
var PluginInterface = require('./../../PluginInterface.js');

var VLCPlugin = {

	m_app: null,
	m_exe_path: null,

	// Default init - calls super init
	init: function(callback) {
		console.log('VLCPlugin:: init');

		// Init the plugin by calling the super init
		PluginInterface.init_express(__dirname, function(error, app) {
			VLCPlugin.m_app = app;
			VLCPlugin.setup_vlc_path();
			VLCPlugin.setup_routes();
			callback(error);
		});
	},

	// return the app instance to the framework
	get_app: function() {
		return VLCPlugin.m_app;
	},

	// Custom routes for this plugin
	setup_routes: function() {
		console.log('VLCPlugin:: setup_routes');

		// GET /
		VLCPlugin.m_app.get('/', function(request, response) {
			console.log(__dirname);
			console.log('VLC @ GET /');
			response.render('vlc');
		});

		// GET /
		VLCPlugin.m_app.get('/open', function(request, response) {
			console.log('VLC @ GET /open');
			if(VLCPlugin.m_exe_path == null) {
				console.log('Exe is not defined - error!');
				response.send('Error - exe is not defined');
			}
			else {
				exec('"' + VLCPlugin.m_exe_path + '"', function(error, stdout, stderr) {
					console.log('stdout: ' + stdout);
				    console.log('stderr: ' + stderr);
				    if (error !== null) {
				      console.log('exec error: ' + error);
				    }
				});
			}
		});
	},

	setup_vlc_path: function() {
		vlc_path = path.join(process.env['PROGRAMFILES'], 'VideoLAN', 'VLC', 'vlc.exe');
		fs.exists(vlc_path, function(exists) {
			if(exists) {
				VLCPlugin.m_exe_path = vlc_path;
			}
			else {
				// Perhaps this is a 32bit app on a x64 machine
				vlc_x86_path = path.join(process.env['PROGRAMFILES(X86)'], 'VideoLAN', 'VLC', 'vlc.exe');
				fs.exists(vlc_x86_path, function(exists) {
					if(exists) {
						VLCPlugin.m_exe_path = vlc_x86_path;
					}
				});
			}
		});
	},
};

module.exports = VLCPlugin;