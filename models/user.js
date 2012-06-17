var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;

exports.UserModel = new Schema({
    username : String,
    password : String,
    lastlogin: {type: Date, default: null},
    lastip   : {type: String, default: ''}
});

mongoose.model("User", exports.UserModel);