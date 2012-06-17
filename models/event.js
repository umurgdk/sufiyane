var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;

exports.EventModel = new Schema({
    name     : String,
    photo    : {
	big    : String,
	small  : String
    },
    photoUrl : String,
    text     : String,
    date     : { type: Date, default: Date.now },
    future   : Boolean
});

mongoose.model ('Event', exports.EventModel);