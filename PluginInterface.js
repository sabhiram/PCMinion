// Base class of any plugin - implements a common setup and init so that
// the derived plugin can simply define what routes it wishes to implement.
// Alternatively, the plugin is welcome to override all of these functions
// to customize their express server. This base plugin assumes that the 
// rendering engine used will be ejs, with the templates located in a 
// "views" folder relative to the plugin.
var _ 		= require('underscore')._;
var util    = require('util');
var path    = require('path');
var fs 		= require('graceful-fs');
var Async 	= require('Async');
var exec    = require('child_process').exec;

var PluginInterface = {

	// Helper function which returns an instance of an express app
	// ready to setup its routes. This assumes default settings
	// of views for the templates and public for its other js/css
	// files. Uses ejs as a template language.
	init_express: function(dir, callback) {
		console.log('BasePlugin:: init_express');
		
		var error = null;
		var express = require('express');
		var app = express();
		
		// init the express app
		app.configure(function() {
			app.use(express.static(path.join(dir, 'public')));
			app.set('view options', {layout: false});
			app.set('view engine', 'ejs');
			app.set('trust proxy', true);
			app.set('views', path.join(dir, 'views'))
		});

		callback(error, app);
	},

	run_ahk_script: function(script, params, callback) {
		var temp_dir = path.join(__dirname, 'temp');
		var script_name = '_' + (new Date()).getMilliseconds() + '.ahk';
		var temp_file = path.join(temp_dir, script_name);
		var _stderr = null;

		Async.waterfall([
			// 1. Create folder for temp scripts
			function make_temp_dir(next_step) {
				fs.exists(temp_dir, function(exists) {
					if(!exists) {
						fs.mkdir(temp_dir, next_step);
					}
					else next_step();
				});
			},
			// 2. Create the temporary script...
			function make_temp_script(next_step) {
				fs.writeFile(temp_file, script, 'utf-8', next_step);
			},
			// 3. Run the script...
			function run_script(next_step) {
				console.log('Running script ' + script_name);
				exec([temp_file, params].join(' '), function(error, stdout, stderr) {
					if(error) console.log('Error: ' + error);
					//console.log('StdOut: ' + stdout);
					//console.log('StdErr: ' + stderr);
					_stderr = stderr;
					next_step(error);
				});
			},
			// 4. Delete script...
			function delete_script(next_step) {
				fs.unlink(temp_file, next_step);
			},
		], function(error, result) {
			if(error) console.log('Unable to run ahk script. Error: ' + error);
			callback(error, _stderr);
		});
	},
};

module.exports = PluginInterface;