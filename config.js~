exports.PUBLIC_PATH = __dirname + "/public";

//
// Product types, used by;
// Routes, Upload Paths
// {{{
exports.PRODUCT_TYPES = [
    "tespih", "tablo", "kitap", "esans"
];
// }}}

//
// Routes, clean urls
// !! Product pages needs :type parameter
// {{{
exports.ROUTES = {
    product: {
	add    : "/urun/:type/yeni",
	edit   : "/urun/:type/:id/duzenle",
	remove : "/urun/:type/:id/sil"
    },
    category: {
	add         : "/kategori/:type/yeni",
	edit        : "/kategori/:type/duzenle",
	remove      : "/kategori/:type/sil",
	productList : "/kategori/:type/:id/products",
	list        : "/kategori/:type/liste"
    }
};
// }}}

//
// Image size constants for uploaded product images
// {{{
exports.BIG_IMG_SIZE = { w: 352, h: 352 };
exports.SMALL_IMG_SIZE = { w: 200, h: 150 };

exports.FOUNDER_IMG_SIZE = { w: 150, h: 150 };

exports.EVENT_BIG_IMG_SIZE   = { w: 600, h: 500 };
exports.EVENT_SMALL_IMG_SIZE = { w: 90 , h: 70  };
// }}}

//
// How to system generate image names?
// {{{
exports.IMG_NAME_GENERATION_PARAMS = [
    ":type", ":id", ":name"
];
exports.IMG_NAME_GENERATION = ":type_:id";
// }}}


// URL PREFIXES
// {{{
exports.FOUNDER_IMG_PREFIX = "/images/founders/normal/";
exports.EVENT_NORMAL_IMG_PREFIX = "/images/events/normal/";
exports.EVENT_SMALL_IMG_PREFIX = "/images/events/thumbnail/";
// }}}

//
// Upload paths
// Match the :type of content
// {{{
exports.UPLOAD_PREFIX   = __dirname + "/public/images";
exports.UPLOAD_TMP_DIR  = "/tmp";
    
exports.UPLOAD_PATHS = {
    tespih: {
	normal    : exports.UPLOAD_PREFIX + "/tespih/normal",
	thumbnail : exports.UPLOAD_PREFIX + "/tespih/thumbnails"
    },
    tablo: {
	normal    : exports.UPLOAD_PREFIX + "/tablo/normal",
	thumbnail : exports.UPLOAD_PREFIX + "/tablo/thumbnails"
    },
    kitap: {
	normal    : exports.UPLOAD_PREFIX + "/kitap/normal",
	thumbnail : exports.UPLOAD_PREFIX + "/kitap/thumbnails"
    },
    esans: {
	normal    : exports.UPLOAD_PREFIX + "/esans/normal",
	thumbnail : exports.UPLOAD_PREFIX + "/esans/thumbnails"
    },
    founder: {
	normal    : exports.UPLOAD_PREFIX + "/founders/normal",
	thumbnail : exports.UPLOAD_PREFIX + "/founders/thumbnail"
    },
    event: {
	normal    : exports.UPLOAD_PREFIX + "/events/normal",
	thumbnail : exports.UPLOAD_PREFIX + "/events/thumbnail"
    }
};
// }}}