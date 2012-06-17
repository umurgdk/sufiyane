var mongoose = require('mongoose');
require('../models/about');
var About = mongoose.model('About');

mongoose.connect('mongodb://localhost:11427/sufiyane');
About.findOne({}, function(err, about) {
	about.founders[2].remove();
	about.save(function(err) {
		
	});
});

