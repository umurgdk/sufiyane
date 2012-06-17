var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;

exports.MessageModel = new Schema({
    name    : String,
    email   : String,
    message : String,
    date    : {type: String, default: ""},
    created : {type: Date, default: Date.now},
    marked  : {type: Boolean, default: false}
});

exports.MessageModel.pre('save', function (next) {
    if (this.date == "") {
	var d = new Date();
	var hour = d.getHours() + ':' + d.getMinutes();
	var date = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear();
	this.date = hour + ' @ ' + date;
    }
    
    next();
});

mongoose.model('Message', exports.MessageModel);