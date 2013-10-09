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
	m_exe_path: null
};

// Any plugin must implement the following functions:
// init and get_app, where get_app returns an instance of the
// express app running for this plugin.
Plugin.init = function(global_settings) {
	console.log('VLC Plugin Init called');
	_settings = global_settings;

	// VLC Init..
	this.setup_vlc_path();

	// Instatiate express app
	this.setup_express_server();

	// Setup this plugins routes
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
		console.log('VLC @ GET /');
		response.render('vlc');
	});

	// GET /
	app.get('/open', function(request, response) {
		console.log('VLC @ GET /open');
		if(this.m_exe_path == null) {
			console.log('Exe is not defined - error!');
			response.send('Error - exe is not defined');
		}
		else {
			exec('"' + this.m_exe_path + '"', function(error, stdout, stderr) {
				console.log('stdout: ' + stdout);
			    console.log('stderr: ' + stderr);
			    if (error !== null) {
			      console.log('exec error: ' + error);
			    }
			});
		}
	});
}

Plugin.setup_vlc_path = function() {
	vlc_path = path.join(process.env['PROGRAMFILES'], 'VideoLAN', 'VLC', 'vlc.exe');
	fs.exists(vlc_path, function(exists) {
		if(exists) {
			this.m_exe_path = vlc_path;
		}
		else {
			// Perhaps this is a 32bit app on a x64 machine
			vlc_x86_path = path.join(process.env['PROGRAMFILES(X86)'], 'VideoLAN', 'VLC', 'vlc.exe');
			fs.exists(vlc_x86_path, function(exists) {
				if(exists) {
					this.m_exe_path = vlc_x86_path;
				}
			});
		}
	});
}

module.exports = Plugin;
