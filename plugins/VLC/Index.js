var _ 				= require('underscore')._;
var util    		= require('util');
var path    		= require('path');
var fs 				= require('graceful-fs');
var request 		= require('request');
var exec    		= require('child_process').exec;

var PluginInterface = null;

var m_exe_path = null;
var Plugin = {

	// Default init - calls super init
	init: function(interface, callback) {
		console.log('Initializing VLC Plugin');
		PluginInterface = interface;

		// Init the plugin by calling the super init
		PluginInterface.init_express(__dirname, function(error, app) {
			if(error) callback(error, null);

			Plugin.setup_vlc_path();
			
			Plugin.setup_routes(app);
			
			callback(error, app, [
				'VLC Plugin can be used to do things like installing, updating',
				'and controlling VLC on your PC. This is particularly usefull',
				'when your tv is connected to the same PC.'
			].join(' '));
		});
	},

	// Custom routes for this plugin
	setup_routes: function(app) {
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
	},

	// Setup VLC paths so we can launch it etc
	setup_vlc_path: function() {
		var vlc_path = path.join(process.env['PROGRAMFILES'], 'VideoLAN', 'VLC', 'vlc.exe');
		fs.exists(vlc_path, function(exists) {
			if(exists) {
				Plugin.m_exe_path = vlc_path;
			}
			else {
				// Perhaps this is a 32bit app on a x64 machine
				vlc_x86_path = path.join(process.env['PROGRAMFILES(X86)'], 'VideoLAN', 'VLC', 'vlc.exe');
				fs.exists(vlc_x86_path, function(exists) {
					if(exists) {
						Plugin.m_exe_path = vlc_x86_path;
					}
				});
			}
		});
	},
};

module.exports = Plugin;