// A slightly more useful console wrapper
var Console = {
	DEBUG_ENABLED: 				true,
	FUNCTION_TRACE_ENABLED: 	true,
	TODO_ENABLED:				true,
	ADD_TIMESTAMP:				false,

	m_debug_indent:				0,

	enter: function(fn_name) {
		if(this.FUNCTION_TRACE_ENABLED) {
			this.debug(fn_name, 'ENTER:');
			this.m_debug_indent += 1;
		}
	},

	exit: function(fn_name) {
		if(this.FUNCTION_TRACE_ENABLED) {
			this.m_debug_indent = Math.max(this.m_debug_indent - 1, 0);
			this.debug(fn_name, 'EXIT:');
		}
	},

	todo: function(str, description) {
		if(this.TODO_ENABLED) {
			this.log('TODO: ' + str);
			this.log('   ' + description);
		}
	},

	error: function(str, error) {
		this.log('ERROR: ' + error + '. ' + str);
	},

	get_debug_str: function(str, tag) {
		if(tag == null && this.m_debug_indent != 0) {
			tag = '       ';
		}
		else if(tag == null) {
			tag = '';
		}
		var indent = '';
		for(var idx = 0; idx < this.m_debug_indent; idx++) {
			indent += '  ';
		}
		return tag + indent + str;
	},

	debug: function(str, tag) {
		if(this.DEBUG_ENABLED) {
			var s = '';
			if(this.ADD_TIMESTAMP) {
				s = new Date() + ': '; 
			}
			this.log(this.get_debug_str(s + str, tag));
		}
	},

	underline: function(str) {
		var ul = _.reduce(str, function(s, ch) { return s + '-'; }, '');
		this.log(str);
		this.log(ul);
	},

	log: function(str) {
		console.log(str);
	},

};

module.exports = Console;