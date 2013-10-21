// Base class of any plugin - implements a common setup and init so that
// the derived plugin can simply define what routes it wishes to implement.
// Alternatively, the plugin is welcome to override all of these functions
// to customize their express server. This base plugin assumes that the 
// rendering engine used will be ejs, with the templates located in a 
// "views" folder relative to the plugin.
var path = require('path');

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
};

module.exports = PluginInterface;