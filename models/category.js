var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Product = require ('./product').ProductModel;

exports.CategoryModel = new Schema({
    type     : String,
    name     : String,
    date     : { type: Date, default: Date.now },
    products : [Product]
});

mongoose.model ("Category", exports.CategoryModel)

