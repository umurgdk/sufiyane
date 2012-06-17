var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ContactModel = new Schema({
    telephone : {type: String, default: ''},
    fax       : {type: String, default: ''},
    email     : {type: String, default: ''},
    weekday   : {type: String, default: ''},
    weekend   : {type: String, default: ''},
    address   : {type: String, default: ''}
});

mongoose.model("Contact", ContactModel);

var Contact = mongoose.model('Contact');

Contact.findOne({}, function (err, contact) {
    if (err) {
	console.log('[ERROR - Contact ilklendirme]: '+err.message);
    } else if(!contact) {
	var c = new Contact();
	c.save(function (err) {
	    console.log('[ERROR - Contact ilklendirme - save]: '+err.message);
	});
    }
});