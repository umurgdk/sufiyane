// required modules {{{
var gm = require ("gm");
var pt = require ("path");
var fs = require ("fs");
// }}}

// private function parseImageDataFromDataUri
// params
//     data  :  String   -- Contains data/uri to be parsed
// return
//     Object  -- parsed data/uri {
//         data  : String  -- Base64 encoded image data
//         mime  : String  -- Contains mime type of image
//     }
// {{{
function parseImageDataFromDataUri(data) {
    var dataPos  = data.indexOf(',');
    var imagePos = data.indexOf('image');
    
    var imgData  = data.slice(dataPos+1);
    var mimeType = data.slice(imagePos,data.indexOf(';'));

    return {
	data: imgData,
	mime: mimeType
    };
}
// }}}
// private function getExtensionFromMime
// params
//   mime     :  String   -- Contains mime name of file
// return
//   String  -- contains file extension
// {{{
function getExtensionFromMime(mime) {
    var imageExts = {
	"image/jpeg": ".jpg",
	"image/gif" : ".gif",
	"image/png" : ".png"
    };

    return imageExts[mime];
}
// }}}
// function saveImageFromData
// params
//   dstPath  :  String   -- Full image path for saving decoded img
//   imgData  :  String   -- Contains data/uri come from front-end
//   callback :  Function -- Function, called after database operation {
//       error      : Null/error -- if there is an error not null
//       extension  : String     -- file extension of image
//   }
// {{{
exports.saveImageFromData = function (dstPath, imgdata, callback) {
	try {
		var parsedUri = parseImageDataFromDataUri (imgdata);

		var imgBuf	= new Buffer (parsedUri.data, "base64");
		var extension = getExtensionFromMime (parsedUri.mime);

		if (extension) {
			fs.writeFile (dstPath+extension, imgBuf, 'binary', function (err) {
				callback (err, extension);
			});
		} else {
			callback("Unkown image format");
		}
    } catch (err) {
		callback(err);
	}
};
// }}}
// function size
// params
//   srcPath  :  String   -- Full image path
//   callback :  Function -- Function, called after database operation {
//       error    : Null/error -- if there is an error not null
//       size     : Object     -- contains width and height values
//   }
// {{{
exports.size = function (srcPath, callback) {
	try {
		gm(srcPath).size(function (err, size) {
			callback(err,size);
		});
	} catch (err) {
		callback(err);
	}
};
// }}}
// function crop
// params
//   srcPath  :  String   -- Full image path to be cropped.
//   dstPath  :  String   -- Full image path to save cropped image
//   options  :  Object   -- Required values for cropping operation {
//       w    :  Number
//       h    :  Number
//       x    :  Number
//       y    :  Number
//   }
//   callback :  Function -- Function, called after database operation {
//       error    : Null/error -- if there is an error not null
//   }
// {{{
exports.crop = function (srcPath, dstPath, options, callback) {
	try {
		if (pt.exists (dstPath))
		fs.unlink (dstPath);

		gm(srcPath).
		crop (options.w, options.h, options.x, options.y).
		write (dstPath, function (err) {
			callback(err);
		});
	} catch(err) {
		callback(err);
	}
};
// }}}
// function cropThenResize
// params
//   srcPath  :  String   -- Full image path to be cropped.
//   dstPath  :  String   -- Full image path to save cropped image
//   options  :  Object   -- Required values for cropping operation {
//       crop   :  Object   -- contains (x,y,w,h) values for cropping
//       resize :  Object   -- contains (w,h) values for resizing
//       
//   }
//   callback :  Function -- Function, called after database operation {
//       error    : Null/error -- if there is an error not null
//   }
// {{{
exports.cropThenResize = function (srcPath, dstPath, options, callback) {
	try {
		if(pt.exists (dstPath)) {
		fs.unlink (dstPath);
		}

		gm (srcPath).
		crop (options.crop.w, options.crop.h, options.crop.x, options.crop.y).
		resize (options.resize.w, options.resize.h).
		write (dstPath, function (err) {
			callback(err);
		});
	} catch (err) {
		callback(err);
	}
};
// }}}
// function resizeThenCrop
// params
//   srcPath  :  String   -- Full image path to be cropped.
//   dstPath  :  String   -- Full image path to save cropped image
//   options  :  Object   -- Required values for cropping operation {
//       crop   :  Object   -- contains (x,y,w,h) values for cropping
//       resize :  Object   -- contains (w,h) values for resizing
//       
//   }
//   callback :  Function -- Function, called after database operation {
//       error    : Null/error -- if there is an error not null
//   }
// {{{
exports.resizeThenCrop = function (srcPath, dstPath, options, callback) {
	try {
		if(pt.exists (dstPath)) {
		fs.unlink (dstPath);
		}

		gm (srcPath).
		resize (options.resize.w, options.resize.h).
		crop (options.crop.w, options.crop.h, options.crop.x, options.crop.y).
		write (dstPath, function (err) {
			callback(err);
		});
	} catch (err) {
		callback(err);
	}
};
// }}}


