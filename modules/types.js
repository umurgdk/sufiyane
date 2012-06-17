// This module contains operations for products.
// Not like app.js this module only interact with
// models(database) and images(files)

// required modules {{{
var _  = require('underscore');
var as = require('async');
var db = require('mongoose');
var fs = require('fs');

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Config = require('../config');
var Img    = require('./image');
// }}}

// initializa models {{{
require('../models/product');
require('../models/category');
require('../models/event');

var Product  = db.model('Product');
var Category = db.model('Category');
var Event    = db.model('Event');
// }}}

// FUNCTION: allCategories
// params
//   type     :  String   -- One of the :types     @config.js
//   callback :  Function -- Function, called after database operation {
//       error      : Null/error -- if there is an error not null
//       categories : Array      -- Categories list
//   }
// {{{

exports.allCategories = function (type,
				  callback_) {
    Category.find ({type: type}, [], function (err, categories) {
	if (err) {
	    callback_ (err, null);
	} else {
	    callback_ (null, categories);
	}
    });
};

// }}}
// FUNCTION: getProducts
// params
//   type     :  String   -- One of the :types     @config.js
//   limit    :  String   -- Category id
//   callback :  Function -- Function, called after database operation {
//       error    : Null/error -- if there is an error not null
//       products : Array      -- Products belongs to named category
//   }
// {{{

exports.getProducts = function (type, limit, callback) {
    Product.find({type: type})
	   .sort('date', 'descending')
	   .limit(limit).run(function (err,products) {
	if (err) {
	    callback(err, null);
	} else {
	    callback(null, products);
	}
    });    
};

// }}}
// FUNCTION: updateCategory
// params
//   type     :  String   -- One of the :types     @config.js
//   id       :  String   -- Contains category' ObjectId
//   fields   :  Objecr   -- Contains updated fields
//   callback :  Function -- Function, called after database operation {
//       error    : Null/error -- if there is an error not null
//       category : Category   -- Updated and saved category object
//   }
// {{{

exports.updateCategory = function (type, id, fields, callback) {
    as.waterfall([
	function (callback) {
	    Category.findById(id, function (err, category) {
		callback(err,category);
	    });
	},
	function (category, callback) {
	    _.extend(category, fields);
	    category.save(function (err) {
		callback(err, category);
	    });
	}
    ],function (err, category) {
	callback(err, category);
    });
};

// }}}
// FUNCTION: findProductsFromCategoryId
// params
//   type     :  String   -- One of the :types     @config.js
//   id       :  String   -- Category id
//   callback :  Function -- Function, called after database operation {
//       error    : Null/error -- if there is an error not null
//       products : Array      -- Products belongs to named category
//   }
// {{{
exports.findProductsFromCategoryId = function (type,
					       id,
					       callback_) {
    as.waterfall([
	function (callback) {
	    Category.findById(id, function (err,cat) {
		callback (err|(!cat),cat);
	    });
	},
	function (category, callback) {
	    as.map (category.products, function (product_id, mapCallback) {
		Product.findById (product_id, function (err, product) {
		    mapCallback (err|(!product), product);
		});
	    }, callback);
	}
    ], function (err, products) {
	if (err) {
	    console.log ("Error: Kategoriye ait ürünler alınırken hata");
	    callback_ (err, null);
	} else {
	    callback_ (null|(!products), products);
	}
    });
};
// }}}
// FUNCTION: getImageUrls
// params
//   type     :  String   -- One of the :types     @config.js
//   product  :  Product  -- Product object with ObjectId
// return
//   urls     :  Object   -- Contains small and big image urls
// {{{

exports.getImageUrls = function (type,
				 product) {
    var smallImagePos = product.photo.small.indexOf("images") - 1;
    var bigImagePos = product.photo.big.indexOf("images") - 1;
    
    var urls = {
	small  : product.photo.small.slice(smallImagePos),
	big    : product.photo.big.slice(bigImagePos)
    };

    return urls;
};

// }}}
// FUNCTION: saveProduct
// params
//   type       :  String   -- One of the :types     @config.js
//   categoryId :  String   -- Contains category's ObjectId
//   fields     :  Object   -- Filled record fields  @config.js
//   callback   :  Function -- Function, called after database operation {
//       error    : Null/error -- if there is an error not null
//       category : Category   -- object with ObjectId
//       product  : Product    -- object with ObjectId
//   }
// {{{

exports.saveProduct = function (type,
				categoryId,
				fields,
				callback_) {
    as.waterfall([
	function (callback) {
	    Category.findById(categoryId, function (err,cat) {
		callback(err, cat);
	    });
	},
	function (cat, callback) {
	    var product = new Product();
	    product.type = type;
	    product.category = categoryId;

	    _.extend(product,fields);
	    product.save(function (err) {
		callback(err,cat,product);
	    });
	},
	function (cat,product,callback) {
	    cat.products.push(product);
	    cat.save(function (err) {
		callback(err, cat, product);
	    });
	}
    ], function (err, cat, product) {
	callback_(err,cat,product);
    });
};

// }}}
// FUNCTION: saveCategory
// params
//   type     :  String   -- One of the :types     @config.js
//   fields   :  Object   -- Filled record fields  @config.js
//   callback :  Function -- Function, called after database operation {
//       error    : Null/error -- if there is an error not null
//       category : Category   -- object with ObjectId
//   }
// {{{

exports.saveCategory = function (type,
				 fields,
				 callback_) {
    var category = new Category();

    category.type = type;
    _.extend(category, fields);
    category.save(function (err) {
	callback_(err, category);
    });
};

// }}}
// FUNCTION: removeProductFromId
//
// params
//   type         :  String   -- One of the :types     @config.js
//   pid          :  String   -- Contains product's ObjectId
//   callback     :  Function -- Function, called after database operation {
//       error    :  Null/error -- if there is an error not null
//       category :  Category object without product
//   }
// {{{

exports.removeProductFromId = function (type,pid, callback) {
    as.waterfall([
	function (cb) {
	    Product.findById(pid, function (err,product) {
		if(err)
		    console.log("Product bulunamadı " + pid + "\n" + err);
		cb(err,product);
	    });
	}, function (product,cb) {
	    var images = [
		product.photo.big,
		product.photo.small
	    ];

	    as.forEach(images, function (img, cb_) {
		fs.unlink(img, function (err) {
		    cb_(err);
		});
	    },function (err) {
		if(err)
		    console.log('dosya silme hatası');
		cb(err, product);
	    });
	}, function (product, cb) {
	    var cid = product.category;
	    Category.findById(cid+"", function (err, category) {
		if (err)
		    console.log('kategori bulma hatası');
		cb(err,product,category);
	    });
	}, function (product, category, cb) {
	    product.remove(function (err) {
		if(err)
		    console.log('product silme hatası');
		cb(err,category);
	    });
	}, function (category, cb) {
	    category.products.id(pid).remove();

	    category.save(function (err) {
		if (err)
		    console.log('kategoriden product silme hatas');
		cb(err, category);
	    });
	}
    ],function (err,category) {
	callback(err,category);
    });
};

// }}}
// FUNCTION: removeCategoryFromId
//
// params
//   type         :  String   -- One of the :types     @config.js
//   categoryId   :  String   -- Contains category's ObjectId
//   callback     :  Function -- Function, called after database operation {
//       error    :  Null/error -- if there is an error not null
//   }
// {{{

exports.removeCategoryFromId = function (type,
					 categoryId,
					 callback_) {
    as.waterfall([
	function (callback) {
	    Category.findById(categoryId, function (err,cat) {
		callback (err, cat);
	    });
	},
	function (cat, callback) {
	    as.forEach(cat.products, function (product, cb_) {
		exports.removeProductFromId(type, product._id, function (err, __) {
		    cb_(err);
		});
	    }, function (err) {
		callback(err, cat);
	    });
	},
	function (cat, callback) {
	    Category.remove ({_id:categoryId},function (err) {
		callback (err);
	    });
	}
    ], function (err) {
	callback_ (err);
    });
};

// }}}
// FUNCTION: changeProductCategory
//
// params
//   type         :  String   -- One of the :types     @config.js
//   product      :  Product 
//   tcid         :  String   -- Target category id
//   callback     :  Function -- Function, called after database operation {
//       error    :  Null/error -- if there is an error not null
//       product  :  Moved product object
//   }
// {{{
exports.changeProductCategory = function (type, product,tcid, callback) {
    var cid = product.category;
    as.waterfall([
	function (cb) {
	    Category.findById(cid, function (err, category) {
		category.products.id(product._id).remove();
		category.save(function (err) {
		    cb(err);
		});
	    });
	}, function (cb) {
	    Category.findById(tcid, function (err, category) {
		category.products.push(product);
		category.save(function (err) {
		    cb(err, category);
		});
	    });
	}, function (category, cb) {
	    product.category = category._id;
	    product.save(function (err) {
		cb(err,product);
	    });
	}
    ],function (err, product) {
	callback(err, product);
    });
};
// }}}
// FUNCTION: saveProductImage
// 
// this function called after product save,
// image upload paths configured by @config.js
// image names generated via rules which defined by @config.js
// 
// params
//   type     :  String   -- One of the :types     @config.js
//   product  :  Product  -- Saved (has _id)  product object
//   imgdata  :  String   -- contains image data/uri, encoded base64
//   coords   :  Object   --  contains x,y,w,h values for cropping
//   callback :  Function -- Function, called after upload operation {
//       error     : Null/error -- if there is an error not null
//       product   : Product    -- saved with generated image paths 
//   }
// {{{

exports.saveProductImage = function (type,
				     product,
				     imgdata,
				     coords,
				     callback_) {
    //
    // Generate an uniq image name via rules whick defined by @config.js
    //
    var imageName = Config.IMG_NAME_GENERATION;
    var params    = {
	":type"   : type,
	":id"     : product._id,
	":name"   : product.name
    };

    _.each(Config.IMG_NAME_GENERATION_PARAMS, function (param) {
	if(imageName.indexOf(param) !== -1 &&
	   params[param]) {
	    imageName = imageName.replace(param, params[param]);
	}
    });

    //
    // Generate full image paths from generated uniq image name
    //
    var imgTempPath   = Config.UPLOAD_TMP_DIR + "/" + imageName;
    var imgNormalPath = Config.UPLOAD_PATHS[type].normal + '/' + imageName;
    var imgThumbPath  = Config.UPLOAD_PATHS[type].thumbnail + '/' + imageName;
    as.waterfall([
	//
	// Save base64 encoded image data to temp file
	//
	function (callback) {
	    Img.saveImageFromData (imgTempPath, imgdata, function (err, extension) {
		imgTempPath   += extension;
		imgNormalPath += extension;
		imgThumbPath  += extension;
		
		callback(err);
	    })
	},
	//
	// Crop/Resize to BIG_IMG_SIZE @config.js
	//
	function (callback) {
	    var cropFun = Img.crop;
	    var options = coords;
	    
	    if (coords.w > Config.BIG_IMG_SIZE.w ||
		coords.h > Config.BIG_IMG_SIZE.h) {
		
		cropFun = Img.cropThenResize;
		options = {
		    crop   : coords,
		    resize : Config.BIG_IMG_SIZE
		}; 
	    }

	    cropFun (imgTempPath, imgNormalPath, options, function (err) {
		callback(err);
	    })
	},
	//
	// Crop/Resize to SMALL_IMG_SIZE @config.js
	//
	function (callback) {
	    var options = {
		crop: {
		    x: 0,
			y: 0,
		    w: Config.SMALL_IMG_SIZE.w,
		    h: Config.SMALL_IMG_SIZE.h
		},
		resize: {
			w: (coords.w > coords.h ? -1 : Config.SMALL_IMG_SIZE.w),
		    h: (coords.w > coords.h ? Config.SMALL_IMG_SIZE.h : -1),
		}
	    };
	    Img.resizeThenCrop (imgNormalPath, imgThumbPath, options, function (err) {
		callback(err)
	    });
	},
	//
	// Remove temp file
	//
	function (callback) {
	    fs.unlink(imgTempPath, function (err) {
		callback(err);
	    });
	}
    ], function (err) {
	if (err) {
	    callback_(err);
	} else {
	    product.photo = {
		big  : imgNormalPath,
		small: imgThumbPath
	    };

	    var bSp  = imgNormalPath.split('/');
	    var burl = bSp[bSp.length-1];

	    var sSp  = imgThumbPath.split('/');
	    var surl = sSp[sSp.length-1];
	    
	    product.urls = {
		big   : burl,
		small : surl
	    }
	    
	    product.save (function (err) {
		callback_ (err, product)
	    })
	}	
    });
};

// }}}
// FUNCTION: saveFounderImage
// 
// this function called after product save,
// image upload paths configured by @config.js
// image names generated via rules which defined by @config.js
// 
// params
//   founder  :  Founder  -- Saved founder object
//   fid      :  Integer  -- Founder index
//   imgdata  :  String   -- contains image data/uri, encoded base64
//   coords   :  Object   --  contains x,y,w,h values for cropping
//   callback :  Function -- Function, called after upload operation {
//       error     : Null/error -- if there is an error not null
//       founder   : Product    -- saved with generated image paths 
//   }
// {{{
exports.saveFounderImage = function (founder,fid,imgdata,coords,callback_) {
    var imgName       = 'kurucu_' + fid;
    var imgTempPath   = Config.UPLOAD_TMP_DIR + "/" + imgName;
    var imgNormalPath = Config.UPLOAD_PATHS.founder.normal + '/' + imgName;
    var imgThumbPath  = Config.UPLOAD_PATHS.founder.thumbnail + '/' + imgName;

    as.waterfall([
	function (callback) {
	    Img.saveImageFromData (imgTempPath, imgdata, function (err, extension) {
		imgTempPath   += extension;
		imgNormalPath += extension;
		imgThumbPath  += extension;
		
		callback(err);
	    })
	},
	function (callback) {
	    var cropFun = Img.crop;
	    var options = coords;
	    
	    if (coords.w > Config.FOUNDER_IMG_SIZE.w ||
		coords.h > Config.FOUNDER_IMG_SIZE.h) {
		
		cropFun = Img.cropThenResize;
		options = {
		    crop   : coords,
		    resize : Config.FOUNDER_IMG_SIZE
		}; 
	    }

	    cropFun (imgTempPath, imgNormalPath, options, function (err) {
		callback(err);
	    })
	},
	function (callback) {
	    fs.unlink(imgTempPath, function (err) {
		callback(err);
	    });
	}
    ], function (err) {
	if (err) {
	    callback_(err);
	} else {
	    founder.photo = imgNormalPath;

	    var bSp  = imgNormalPath.split('/');
	    var burl = bSp[bSp.length-1];
	    
	    founder.photoUrl = burl;

	    callback_ (null, founder);
	}	
    });
};
// }}}
// FUNCTION: allEvents
// {{{

exports.allEvents = function (callback) {
    Event.find({}).sort('date', "descending").run(function (err, events) {
	callback(err, events);
    });
};

// }}}
// FUNCTION: saveEventImage
// {{{
exports.saveEventImage = function (event, imgdata, coords, callback_) {
    var imgName       = 'event_' + event._id;
    var imgTempPath   = Config.UPLOAD_TMP_DIR + "/" + imgName;
    var imgNormalPath = Config.UPLOAD_PATHS.event.normal + '/' + imgName;
    var imgThumbPath  = Config.UPLOAD_PATHS.event.thumbnail + '/' + imgName;

    as.waterfall([
	function (callback) {
	    Img.saveImageFromData (imgTempPath, imgdata, function (err, extension) {
		imgTempPath   += extension;
		imgNormalPath += extension;
		imgThumbPath  += extension;
		
		callback(err);
	    })
	},
	function (callback) {
	    var cropFun = Img.cropThenResize;
	    var options = {
		crop   : coords,
		resize : Config.EVENT_BIG_IMG_SIZE
	    };
	    
	    cropFun (imgTempPath, imgNormalPath, options, function (err) {
		callback(err);
	    });
	},
	function (callback) {
	    
	    var options = {
		crop: {
		    x: 0, y: 25,
		    w: Config.EVENT_SMALL_IMG_SIZE.w,
		    h: Config.EVENT_SMALL_IMG_SIZE.h
		},
		resize: {
		    w: Config.EVENT_SMALL_IMG_SIZE.w,
		    h: Config.EVENT_SMALL_IMG_SIZE.w
		}
	    };
	    Img.resizeThenCrop (imgNormalPath, imgThumbPath, options, function (err) {
		callback(err)
	    });
	},
	function (callback) {
	    fs.unlink(imgTempPath, function (err) {
		callback(err);
	    });
	}
    ], function (err) {
	if (err) {
	    callback_(err);
	} else {
	    event.photo.small = imgThumbPath;
	    event.photo.big   = imgNormalPath;

	    var bSp  = imgNormalPath.split('/');
	    var burl = bSp[bSp.length-1];
	    
	    event.photoUrl = burl;
	    event.save(function (err) {
		callback_ (null, event);
	    });
	}	
    });
};
// }}}
