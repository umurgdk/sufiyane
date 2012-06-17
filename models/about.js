var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Founder = new Schema({
    name        : String,
    photo       : String,
    photoUrl    : String,
    description : String
});

exports.AboutModel = new Schema({
    text      : String,
    founders  : [Founder]
});

mongoose.model("About", exports.AboutModel);