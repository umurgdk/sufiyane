// required modules 
var express  = require('express');
var mongoose = require ("mongoose");
var fs       = require ("fs");
var as       = require ('async');
var _        = require ('underscore');

var img      = require ("./modules/image");
var app      = express.createServer();
var _tr      = require ('./modules/translate').translate;

var Config   = require('./config');
var Types    = require('./modules/types');

var json2xml = require('./modules/json2xml');
var cypher = require("./modules/cypher").cypher;

// initialize models 
var Category = mongoose.model('Category');
var Product  = mongoose.model('Product');
var Event    = mongoose.model('Event');

require('./models/about');
var About    = mongoose.model('About');

require('./models/seminar');
var Seminar  = mongoose.model('Seminar');

require('./models/message');
var Message  = mongoose.model('Message');

require('./models/contact');
var Contact  = mongoose.model('Contact');

require('./models/user');
var User     = mongoose.model('User');

// mongoose.connect ('mongodb://localhost/sufiyane');
mongoose.connect ('mongodb://localhost:11427/sufiyane'); 

// APP Configuration {{{
app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/public'));
    //app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(express.cookieParser());
    app.use(express.session({ secret: "nyannyan cat thomas anderson" }));
    app.set('view engine', 'jade');
	app.dynamicHelpers({ messages: require('express-messages') });
    app.set('view options', {
		scripts: [],
		styles : [],
		flash  : {}
    });
});



app.error(function (err,req,res,next) {
	var dt = Date() + "";
	var sp = dt.split(':');
	var date = sp[0] + ':' + sp[1];

	console.log("[ERROR-"+date+"-@"+req.originalUrl+"]"+err);
	if (req.originalUrl.split('/')[1]) {
		if (req.originalUrl.split('/')[1] == 'yonetim') {
			req.flash('error', _tr(err + ''));
			res.redirect('/yonetim');
		};
	}
	else {
		res.redirect("/");
	};
});
// }}}
// Index {{{
app.all('/', function (req,res) {
    res.sendfile(Config.PUBLIC_PATH + '/index.html');
});
// }}}

// SITE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// {{{

// XML - kategoriler.xml {{{
app.get('/xml/kategoriler.xml', function (req,res,next) {
    as.map(["tespih","tablo","kitap","esans"], function (type, cb) {
	Category.find({type: type}, function (err, categories) {
	    cb(err, {type: type, categories: categories});
	});
    }, function (err, results) {
	if (err) {
	    next(err);
	} else {
	    var xmlObj = _.foldl(results, function (obj, type) {
		obj[type.type] = {kategori: _.map(type.categories, function (category) {
		    return {
			"@id"   : category._id,
			"#text" : category.name
		    };
		},{})};
		return obj;
	    }, {});

	    xmlObj = {data: xmlObj};
	    res.header('Content-Type', 'text/xml');
	    res.send(json2xml.xml(xmlObj));
	}
    });
});
// }}}
// XML - ozgecmisler.xml {{{
app.get('/xml/ozgecmisler.xml', function (req,res,next) {
    About.findOne(function (err, about) {
	if (err) {
	    res.header('Content-Type', 'text/xml');
	    res.send("<isimler></isimler>");
	} else {
	    var xmlObject = {};
	    xmlObject["isimler"] = {"isim": _.map(about.founders, function (founder) {
		return {
		    "@tamad" : founder.name,
		    "@img"   : Config.FOUNDER_IMG_PREFIX + founder.photoUrl,
		    "#text"  : founder.description
		};
	    })};

	    res.header('Content-Type', 'text/xml');
	    res.send(json2xml.xml(xmlObject));
	}
    });
});
// }}}
// TEXT - hakkimizda.txt {{{
app.get('/xml/hakkimizda.txt', function (req, res) {
    About.findOne({}, function (err, about) {
	if (err) {
	    console.log("[ERROR]: hakkimzda.txt");
	    res.send("");
	} else {
	    res.send(about.text);
	}
    });
});
// }}}
// XML - geleceketkinlikler.xml {{{
app.get('/xml/geleceketkinlikler.xml', function (req,res,next) {
    Event.find({future: true}, function (err, events) {
	if (err) {
	    console.log("[ERROR]: geleceketkinlikler.xml - ");
	    res.send('');
	} else {
	    var xmlObj = {};
	    xmlObj["data"] = {etkinlik: _.map(events, function (event) {
		return {
		    "@title"    : event.name,
		    "@img"      : Config.EVENT_NORMAL_IMG_PREFIX + event.photoUrl,
		    "@thumbimg" : Config.EVENT_SMALL_IMG_PREFIX  + event.photoUrl,
		    "#text"     : event.text
		};
	    })};

	    res.header('Content-Type', 'text/xml');
	    res.send(json2xml.xml(xmlObj));
	}
    });
});
// }}}
// XML - gecmisetkinlikler.xml {{{
app.get('/xml/gecmisetkinlikler.xml', function (req,res,next) {
    Event.find({future: false}, function (err, events) {
	if (err) {
	    console.log("[ERROR]: geleceketkinlikler.xml - ");
	    res.send('');
	} else {
	    var xmlObj = {};
	    xmlObj["data"] = {etkinlik: _.map(events, function (event) {
		return {
		    "@title"    : event.name,
		    "@img"      : Config.EVENT_NORMAL_IMG_PREFIX + event.photoUrl,
		    "@thumbimg" : Config.EVENT_SMALL_IMG_PREFIX  + event.photoUrl,
		    "#text"     : event.text
		};
	    })};

	    res.header('Content-Type', 'text/xml');
	    res.send(json2xml.xml(xmlObj));
	}
    });
});
// }}}
// XML - seminerler.xml {{{
app.get('/xml/seminerler.xml', function (req,res,next) {
    Seminar.find({active: true}, function (err, seminars) {
	if (err) {
	    console.log("[ERROR]: seminerler.xml - ");
	    res.send("<data></data>");
	} else {
	    var xmlObj = {};
	    xmlObj["data"] = {"seminer": _.map(seminars,function (seminar) {
		var obj =  {
		    "@title"        : seminar.name,
		    "@kisaAciklama" : seminar.shortText,
		    "aciklama" : {"#text": seminar.text},
		    "gunler"   : {}
		};

		// SET DAYS {{{
		if (seminar.days.pazartesi.active) {
		    obj.gunler["pazartesi"] = {
			"@baslama" : seminar.days.pazartesi.start,
			"@bitis" : seminar.days.pazartesi.end
		    };
		}

		if (seminar.days.sali.active) {
		    obj.gunler["sali"] = {
			"@baslama" : seminar.days.sali.start,
			"@bitis" : seminar.days.sali.end
		    };
		}

		if (seminar.days.carsamba.active) {
		    obj.gunler["carsamba"] = {
			"@baslama" : seminar.days.carsamba.start,
			"@bitis" : seminar.days.carsamba.end
		    };
		}

		if (seminar.days.persembe.active) {
		    obj.gunler["persembe"] = {
			"@baslama" : seminar.days.persembe.start,
			"@bitis" : seminar.days.persembe.end
		    };
		}

		if (seminar.days.cuma.active) {
		    obj.gunler["cuma"] = {
			"@baslama" : seminar.days.cuma.start,
			"@bitis" : seminar.days.cuma.end
		    };
		}

		if (seminar.days.cumartesi.active) {
		    obj.gunler["cumartesi"] = {
			"@baslama" : seminar.days.cumartesi.start,
			"@bitis" : seminar.days.cumartesi.end
		    };
		}

		if (seminar.days.pazar.active) {
		    obj.gunler["pazar"] = {
			"@baslama" : seminar.days.pazar.start,
			"@bitis" : seminar.days.pazar.end
		    };
		}
		// }}}


		return obj;
	    })};

	    res.header("Content-Type", "text/xml");
	    res.send(json2xml.xml(xmlObj));
	}
    });
});
// }}}
// XML - iletisim.xml {{{
app.get('/xml/iletisim.xml', function (req,res,next) {
    Contact.findOne({}, function (err, contact) {
	if (err) {
	    console.log("[ERROR]: iletisim.xml");
	    res.send("<data></data>");
	} else {
	    var xmlObj = {
		eposta   : contact.email,
		telefon1 : contact.telephone,
		telefon2 : contact.fax,
		adres    : {
		    b: contact.address
		},
		haftaici : contact.weekday,
		haftasonu: contact.weekend
	    };

	    xmlObj = { data : xmlObj };

	    res.header("Content-Type", "text/xml");
	    res.send(json2xml.xml(xmlObj));
	}
    });
});
// }}}
// XML - urunler {{{
app.get('/xml/:type/:kategori.xml', function (req,res,next) {
    as.waterfall([
	function (cb) {
	    Category.findById(req.params.kategori, function (err, category) {
		cb(err || (!category), category);
	    });
	}, function (category, cb) {
	    Product.find({category: category._id}, function (err, products) {
		cb(err, products);
	    });
	}
    ], function (err, products) {
	if (err) {
	    console.log('[ERROR]: /xml/:type/:kategori.xml');
	    res.send('');
	} else {
	    var xmlObj = {};
	    xmlObj['gallery'] = {'image' : _.map(products, function (product) {
		var urls = Types.getImageUrls(req.params.type, product);
		return {
		    "@isim"         : product.name,
		    "@img"          : urls.big,
		    "@thumbnailimg" : urls.small,
		    "#text"         : product.description
		};
	    })};

	    res.header('Content-Type', 'text/xml');
	    res.send(json2xml.xml(xmlObj));
	}
    });
});
// }}}
// XML - iletişim (POST) {{{
app.post('/iletisim', function (req,res,next) {
    var name    = req.body.name;
    var email   = req.body.email;
    var message = req.body.message;

    var msg = new Message();

    msg.name    = name;
    msg.email   = email;
    msg.message = message;

    msg.save(function (err) {
	if (err) {
	    console.log("[ERROR]: /iletisim");
	} else {
	    res.send('OK');
	}
    });
});
// }}}

// }}}

// ADMIN @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// {{{

// Admin -- Check User Login {{{
app.all("/yonet*", function(req,res,next) {
    if(req.session.user) {
        req.session.cookie.maxAge = 60000 * 20;
	next();
    } else {
        res.redirect('/girisyap');
    }
});
// }}}
// Admin -- Login {{{
app.get('/girisyap', function(req,res,next) {
    res.render('login', {
        title: "Login",
        layout: false,
        scripts: [
            "mootools",
            "mootools-more"
	],
	stylesheets: [
            "login"
        ]
    });
});
// }}}
// Admin -- Login (POST) {{{
app.post('/girisyap', function(req,res,next) {
    var username = req.body.username;
    var password = req.body.password;

    User.findOne({username: username.toString(), password: cypher(password.toString())}, function(err, user) {
        if(err || (!user)) {
            res.redirect('/girisyap');
	} else {
            req.session.cookie.maxAge = 60000 * 20;
            req.session.user = username;

            user.lastlogin = Date.now();
            user.lastip = req.connection.remoteAddress.toString();

            user.save(function (err) { if(err) {console.log("[ERROR]: Girişyap - save");} });

            res.redirect('/yonetim');
        }
    })
});
// }}}
// Admin -- Logout {{{
app.get('/cikisyap', function(req,res,next) {
    if(req.session.user) {
        req.session.cookie.maxAge = 0;
        req.session.user = null;
    }
    res.redirect('/');
});
// }}}
// Admin -- Dashboard {{{
app.get('/yonetim', function (req,res,next) {
    as.map(Config.PRODUCT_TYPES, function (type,callback) {
	Types.allCategories(type, function (err, categories) {
	    var name = type[0].toUpperCase() + type.substr(1);
	    callback (err, {
		name: type,
		title: name,
		categories: categories
	    });
	});
    }, function (err, types) {
	if (err) {
	    next(err);
	} else {
	    res.render('index', {
		title: "Önizleme",
		types: types
	    });
	}
    });
});
// }}}

// ADMIN -- SECTION HAKKIMIZDA @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// Admin -- Hakkımızda (Dashboard) {{{
app.get('/yonetim/hakkimizda', function (req,res,next) {
    as.waterfall([
	function (cb) {
	    About.findOne({}, function (err, about) {
		cb(err,about);
	    });
	},
	function (about, cb) {
	    if (about) {
		cb(null,about);
	    } else {
		var about_  = new About();
		_.each([1,2,3],function (val) {
		    about_.founders.push({
			name        : "İsim Soyisim - " + val,
			photo       : "",
			description : ""
		    });
		});
		
		about_.text = "";
		about_.save(function (err) {
		    cb(err, about_);
		});
	    }
	}
    ],function (err, about) {
	res.render('about', {
	    title   : "Hakkımızda",
	    about   : about,
	    scripts : [
		'jquery'
	    ]
	});
    });
});
// }}}
// Admin -- Hakkimizda Düzenle (FORM) {{{
app.get('/yonetim/hakkimizda/duzenle', function (req,res,next) {
    About.findOne({}, function (err, about) {
	if (err) {
	    next(err);
	} else {
	    about.text = about.text.replace(/<br \/>/g,"\r\n");
	    res.render('aboutEdit', {
		title : 'Hakkımızda Yazısı',
		about : about
	    });
	}
    });
});
// }}}
// Admin -- Hakkimizda Düzenle (POST) {{{
app.post('/yonetim/hakkimizda/duzenle', function (req,res,next) {
    var text = req.body.text;
    text = text.replace(/\r\n/g,"<br />");

    About.findOne({}, function (err, about) {
	about.text = text;
	about.save(function (err) {
	    if (err) {
		next(err);
	    } else {
		res.redirect('/yonetim/hakkimizda');
	    }
	});
    });
});
// }}}
// Admin -- Kurucu Düzenle (FORM) {{{
app.get('/yonetim/hakkimizda/kurucu/:id', function (req,res,next) {
    var id = req.params.id;
    About.findOne({}, function (err, about) {
	if (err) {
	    next(err);
	} else {
	    var founder = about.founders[id];
	    founder.description = founder.description.replace(/<br \/>/g,"\r\n");
	    
	    res.render('aboutFounderEdit', {
		title   : "Hakkimizda - Kurucu - " + founder.name,
		founder : founder,
		id      : id,
		scripts : [
		    'jquery',
		    'jquery.color',
		    'jquery.jcrop',
		    'newProduct'
		],
		styles  : [
		    'jquery.jcrop'
		]
	    });
	}
    });
});
// }}}
// Admin -- Kurucu Düzenle (POST) {{{
app.post('/yonetim/hakkimizda/kurucu/:id', function (req,res,next) {
    var id = req.params.id;

    About.findOne({}, function (err,about) {
	about.founders[id].name        = req.body.name;
	about.founders[id].description = req.body.description;

	if (err) {
	    next(err);
	} else {
	    var founder = about.founders[id];
	    founder.description = founder.description.replace(/\r\n/g,"<br />");
	    
	    if (req.body.image) {
	    if (req.body.image.data.length) {
		Types.saveFounderImage(
		    founder,
		    id,
		    req.body.image.data,
		    req.body.coords,
		    function (err, f) {
			if (err) {
				next(err);
			}
			else {
				about.founders[id] = f;
				about.save(function (err) {
					if (err) {
					next (err);
					} else {
					res.redirect('/yonetim/hakkimizda');
					}
				});
			};
		    });
	    }
	    else {
		about.founders[id] = founder;
		about.save(function (err) {
		    if (err) {
			next(err);
		    } else {
			res.redirect('/yonetim/hakkimizda');
		    }
		});
	    }
	    } else {
		about.founders[id] = founder;
		about.save(function (err) {
		    if (err) {
			next(err);
		    } else {
			res.redirect('/yonetim/hakkimizda');
		    }
		});
	    }
	}
    });
});
// }}}
// }}}

// ADMIN -- SECTION ETKİNLİKLER @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// {{{
// Admin -- Etkinlikler Dashboard {{{
app.get('/yonetim/etkinlikler', function (req,res,next) {
    Types.allEvents(function (err, evts) {
	if (err) {
	    next(err);
	} else {
	    var events = _.groupBy(evts, function(evt) { return evt.future; });
	    
	    var futureEvents = (events.true  ? events.true  : []);
	    var missedEvents = (events.false ? events.false : []);

	    res.render('events', {
		title        : "Etkinlikler",
		futureEvents : (futureEvents.length ? futureEvents : []),
		missedEvents : (missedEvents.length ? missedEvents : [])
	    });
	}
    });
});
// }}}
// Admin -- Etkinlikler Yeni (FORM) {{{
app.get ('/yonetim/etkinlikler/yeni', function (req,res,next) {
    res.render('eventNew.jade', {
	title    : 'Etkinlikler - Yeni Etkinlik',
	event    : null,
	scripts  : [
	    'jquery',
	    'jquery.color',
	    'jquery.jcrop',
	    'newProduct'
	],
	styles   : [
	    'jquery.jcrop'
	]
    });
});
// }}}
// Admin -- Etkinlikler Yeni (POST) {{{
app.post('/yonetim/etkinlikler/yeni', function (req,res,next) {
    var fields = {
	name   : req.body.name,
	future : (req.body.future == "true" ? true : false),
	text   : req.body.text.replace(/\r\n/g, '<br />'),
    };

    as.waterfall([
	function (cb) {
	    var event = new Event();
	    _.extend(event, fields);
	    event.save(function (err) {
		cb(err, event);
	    });
	}, function (event, cb) {
	    var imgData = req.body.image.data;
	    var coords  = req.body.coords;
	    
	    Types.saveEventImage(event, imgData, coords, function (err, e) {
		cb(err);
	    });
	}
    ],function (err) {
	if (err) {
	    next("Yeni Etkinlik - "+err);
	} else {
	    res.redirect('/yonetim/etkinlikler');
	}
    });
});
// }}}
// Admin -- Etkinlikler Sil {{{
app.get('/yonetim/etkinlikler/:id/sil', function (req,res,next) {
    var id = req.params.id;

    Event.findById(id, function (err, event) {
        as.waterfall([
			function   (cb) {
				if(_.isString(event.photo.big)) 
				{
					fs.unlink(event.photo.big, function   (err) {
						cb(err);
					});
				} else {
					cb(null);
				}
			},
			function (cb) {
				if(_.isString(event.photo.small)) 
				{
					fs.unlink(event.photo.small, function (err) {
						cb(err);
					});
				} else {
					cb(null);
				}
			},
			function (cb) {
				Event.remove({_id: event._id}, function (err) {
	    			if (err) {
						cb(err);
				    } else {
						cb(null);
				    }
				});
			}
		], function   (err) {
			if (err) {
				next(err);
			} else {
				res.redirect('/yonetim/etkinlikler');	
			};
		});
    });
});
// }}}
// Admin -- Etkinlik Düzenle (FORM) {{{
app.get('/yonetim/etkinlikler/:id/duzenle', function (req,res,next) {
    var id = req.params.id;
    
    as.waterfall([
	function (cb) {
	    Event.findById(id, function (err, event) {
		cb(err,event);
	    });
	}
    ], function (err, event) {
	if (err || (!event)) {
	    next(err);
	} else {
	    event.text = event.text.replace(/<br \/>/g, "\r\n");
	    res.render('eventNew', {
		title  : 'Etkinlikler - ' + event.name + ' - Düzenle',
		event  : event,
		scripts  : [
		    'jquery',
		    'jquery.color',
		    'jquery.jcrop',
		    'newProduct'
		],
		styles   : [
		    'jquery.jcrop'
		]
	    });
	}
    });
});
// }}}
// Admin -- Etkinlik Düzenle (POST) {{{
app.post('/yonetim/etkinlikler/:id/duzenle', function (req,res,next) {
    var id   = req.params.id;

    var name   = req.body.name;
    var future = (req.body.future == "true" ? true : false);
    var text   = req.body.text.replace(/\r\n/g, '<br />');

    as.waterfall([
	function (cb) {
	    Event.findById(id, function (err,event) {
		cb(err,event);
	    });
	}, function (event, cb) {
	    event.name   = name;
	    event.future = future;
	    event.text   = text;

	    if (req.body.image) {
		var imgdata = req.body.image.data;
		var coords  = req.body.coords;

		Types.saveEventImage(event, imgdata, coords, function (err,e) {
		    cb(err);
		});
	    } else {
		event.save(function (err) {
		    cb(err);
		});
	    }
	}
    ], function (err) {
	if (err) {
	    next(err);
	} else {
	    res.redirect('/yonetim/etkinlikler');
	}
    });
});
// }}}
// }}}

// ADMIN -- SECTION SEMİNERLER @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// {{{

// Admin -- Seminerler Dashboard {{{
app.get('/yonetim/seminerler', function (req,res,next) {
    var dayNames = {
	pazatesi : 'P.Tesi',
	sali     : 'Salı',
	carsamba : 'Çarş.',
	persembe : 'Perş.',
	cuma     : 'Cuma',
	cumartesi: 'C.Tesi',
	pazar    : 'Pazar'
    };
    Seminar.find({}, function (err, seminars) {
	res.render('seminars', {
	    seminars  : seminars,
	    title     : "Seminerler"
	});
    });
});
// }}}
// Admin -- Seminer Düzenle (GET) {{{
app.get('/yonetim/seminerler/:id/duzenle', function (req,res,next) {
    var id = req.params.id;

    Seminar.findById(id, function (err,seminar) {
	if (err || (!seminar)) {
	    next(err);
	} else {
	    var days = _.keys(seminar.days);
	    days = _(days).select(function (day) {
		if(day != 'toElement' && seminar.days[day].start)
		    return true;
		else
		    return false;
	    });
	    days = _(days).map(function (day) {
		return {
			name  : day,
			start : seminar.days[day].start,
			end   : seminar.days[day].end
		};
	    });

	    seminar.text = seminar.text.replace(/<br \/>/g, "\r\n");

	    res.render('seminarEdit', {
		title   : "Seminerler - " + seminar.name + " - Düzenle",
		seminar : seminar,
		days    : days,
		scripts : [
		    'mootools',
		    'mootools-more',
		    'seminars'
		],
		styles  : [
		    'dayhourwidget'
		]
	    });
	}
    });
});
// }}}
// Admin -- Seminer Düzenle (POST) {{{
app.post('/yonetim/seminerler/:id/duzenle', function (req,res,next) {
    var id = req.params.id;

    var days      = req.body["days"];
    var name      = req.body["name"];
    var text      = req.body["text"];
    var active    = (req.body["active"] ? true : false);
    var shortText = req.body.shortText;

    as.waterfall([
	function (cb) {
	    Seminar.findById(id, function (err,seminar) {
			cb(err,seminar);
	    });
	}, function (seminar, cb) {
	    if(days) {
			if(days["pazartesi"]) {
				seminar.days.pazartesi.active = true;
				seminar.days.pazartesi.start  = days.pazartesi.start;
				seminar.days.pazartesi.end    = days.pazartesi.end;
			} else {
				seminar.days.pazartesi.active = false;
			}
			if(days["sali"]) {
				seminar.days.sali.active = true;
				seminar.days.sali.start  = days.sali.start;
				seminar.days.sali.end    = days.sali.end;
			} else {
				seminar.days.sali.active = false;
			}
			if(days["carsamba"]) {
				seminar.days.carsamba.active = true;
				seminar.days.carsamba.start  = days.carsamba.start;
				seminar.days.carsamba.end    = days.carsamba.end;
			} else {
				seminar.days.carsamba.active = false;
			}
			if(days["persembe"]) {
				seminar.days.persembe.active = true;
				seminar.days.persembe.start  = days.persembe.start;
				seminar.days.persembe.end    = days.persembe.end;
			} else {
				seminar.days.persembe.active = false;
			}
			if(days["cuma"]) {
				seminar.days.cuma.active = true;
				seminar.days.cuma.start  = days.cuma.start;
				seminar.days.cuma.end    = days.cuma.end;
			} else {
				seminar.days.cuma.active = false;
			}
			if(days["cumartesi"]) {
				seminar.days.cumartesi.active = true;
				seminar.days.cumartesi.start  = days.cumartesi.start;
				seminar.days.cumartesi.end    = days.cumartesi.end;
			} else {
				seminar.days.cumartesi.active = false;
			}
			if(days["pazar"]) {
				seminar.days.pazar.active = true;
				seminar.days.pazar.start  = days.pazar.start;
				seminar.days.pazar.end    = days.pazar.end;
			} else {
				seminar.days.pazar.active = false;
			}
		}

		seminar.name      = name;
		seminar.text      = text.replace(/\r\n/g, "<br />");
		seminar.active    = active;
		seminar.shortText = shortText;

		seminar.save(function (err) {
			cb(err);
		});
	}],function (err) {
		if (err) {
			res.send(JSON.stringify(err));
		} else {
			res.redirect('/yonetim/seminerler');
		}
	});
});
// }}}

// }}}

// ADMIN -- SECTION ILETIŞIM @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// {{{

// Admin -- İletişim Dashboard {{{
app.get('/yonetim/iletisim', function (req,res,next) {
    as.waterfall([
	function (cb) {
	    Message.find().sort('created', 'descending').run(function (err, msgs) {
		cb(err,msgs);
	    });
	},
	function (msgs, cb) {
	    Contact.findOne({}, function (err, contact) {
		cb(err, contact, msgs);
	    });
	}
    ], function (err, contact, msgs) {
	if (err) {
	    next(err);
	} else {
	    //contact.address = contact.address.replace(/<br \/>/g, "\r\n");
	    res.render('contact', {
		title    : 'İletişim',
		messages : msgs,
		contact  : contact,
		scripts  : [
		    'mootools',
		    'mootools-tips'
		],
		styles   : [
		    'iletisim'
		]
	    });
	}
    });
});
// }}}
// Admin -- İletişim Bilgi Düzenle (FORM) {{{
app.get('/yonetim/iletisim/duzenle', function (req,res,next) {
    Contact.findOne({}, function (err, contact) {
	if (err) {
	    console.log('[ERROR @ İletişim Düzenle - Bul]' + err.message);
	} else {
	    contact.address = contact.address.replace(/<br \/>/g, "\r\n");
	    res.render('contactEdit', {
		title   : 'İletişim Bilgilerini Düzenle',
		contact : contact,
		scripts : [
		    'mootools'
		]
	    });
	}
    });
});
// }}}
// Admin -- İletişim Bilgi Düzenle (POST) {{{
app.post('/yonetim/iletisim/duzenle', function (req,res,next) {
    var telephone = req.body.telephone + '';
    var fax       = req.body.fax       + '';
    var email     = req.body.email     + '';
    var weekday   = req.body.weekday   + '';
    var weekend   = req.body.weekend   + '';
    var address   = req.body.address   + '';

    Contact.findOne({}, function (err, contact) {
	contact.telephone = telephone;
	contact.fax       = fax;
	contact.email     = email;
	contact.weekday   = weekday;
	contact.weekend   = weekend;
	contact.address   = address.replace(/\r\n/g, "<br />");

	contact.save(function (err) {
	    if (err) {
		next(err);
	    } else {
		res.redirect('/yonetim/iletisim');
	    }
	});
    });
});
// }}}
// Admin -- İletişim Mesaj Sil {{{
app.get('/yonetim/iletisim/mesaj/:id/sil', function (req,res,next) {
    var id = req.params.id;

    as.waterfall([
	function (cb) {
	    Message.findById(id, function (err,msg) {
		cb(err,msg);
	    });
	}, function (msg, cb) {
	    Message.remove({_id: msg._id}, function (err) {
		cb(err);
	    });
	}
    ],function (err) {
	if (err) {
	    console.log("[ERROR @ iletişim - mesaj sil]: "+err.message);
	    res.redirect('/yonetim/iletisim');
	} else {
	    res.redirect('/yonetim/iletisim');
	}
    });
});
// }}}
// Admin -- İletişim Mesaj Göster {{{
app.get('/yonetim/iletisim/mesaj/:id', function (req,res,next) {
    var id = req.params.id;

    Message.findById(id, function (err, msg) {
	if (err) {
	    console.log('[ERROR @ iletişim - mesaj göster]: '+err.message);
	    res.redirect('/yonetim/iletisim');
	} else {
	    if(!msg.marked) {
		msg.marked = true;
		msg.save(function (err) {});
	    }
	    res.render('contactShowMessage', {
		msg   : msg,
		title : 'İletişim - Mesaj',
		styles: [
		    'iletisim'
		],
		scripts:[
		    'mootools',
		    'mootools-tips'
		]
	    });
	}
    });
});
// }}}

// }}}

// ADMIN -- SECTION URUN @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// {{{

// Admin -- Urun tipi {{{
app.get('/yonetim/:type', function (req,res,next) {
    var type = req.params.type;
    as.waterfall([
	function (callback) {
	    Types.getProducts(type, 10, function (err, products) {
		callback(err, products);
	    });
	}, function (products, callback) {
	    Types.allCategories(type, function (err, categories) {
		callback(err, products, categories);
	    });
	}
    ], function (err, products, categories) {
	if (err) {
	    next(err);
	} else {
	    res.render('type', {
		type       : type,
		title      : type[0].toUpperCase() + type.substr(1),
		categories : categories,
		products   : products
	    });
	}
    });
});
// }}}

// Admin -- Kategori Sil {{{
app.get('/yonetim/:type/kategori/:id/sil', function (req,res,next) {
    var type = req.params.type;
    var id   = req.params.id;
    
    Types.removeCategoryFromId(type,id, function (err) {
	if (err) {
	    next (err);
	} else {
	    res.redirect("/yonetim/"+type);
	}
    });
});
// }}}
// Admin -- Kategori Ekle (FORM) {{{
app.get('/yonetim/:type/kategori/yeni', function (req,res,next) {
    var type = req.params.type;
    var title = type[0].toUpperCase() + type.substr(1);
    res.render('yeniKategori', {
	title    : title+" - Yeni Kategori",
	category : null,
	type     : type
    });
});
// }}}
// Admin -- Kategori Ekle (POST) {{{
app.post('/yonetim/:type/kategori/yeni', function (req,res,next) {
    var type   = req.params.type;
    var fields = {
	name: req.body.isim
    };
    Types.saveCategory(type, fields, function (err, category) {
	if (err) {
	    next(err);
	} else {
	    res.redirect('/yonetim/'+type);
	}
    });
});
// }}}
// Admin -- Kategori Görünümü {{{
app.get('/yonetim/:type/kategori/:id', function (req,res,next) {
    var id   = req.params.id;
    var type = req.params.type;
    as.waterfall([
	function (callback) {
	    Category.findById(id, function (err, category) {
		callback(err|(!category), category);
	    });
	},
	function (category, callback) {
	    Types.findProductsFromCategoryId(type, id, function (err, products) {
		callback(err, category, products);
	    });
	}
    ],function (err, category, products) {
	if (err) {
	    next(err);
	} else {
	    var typeName = type[0].toUpperCase() + type.substr(1);
	    res.render("showCategory",{
		type    : type,
		title   : typeName + " - " + category.name,
		category: category,
		products: products
	    });
	}
    });
});
// }}} 
// Admin -- Kategori Düzenle (FORM) {{{
app.get('/yonetim/:type/kategori/:id/duzenle', function (req,res,next) {
    var type = req.params.type;
    var id   = req.params.id;
    var title = type[0].toUpperCase() + type.substr(1);
    Category.findById(id, function (err, category) {
	if (err) {
	    next(err);
	} else {
	    res.render('yeniKategori', {
		title    : title + " - " + category.name + " - Düzenle",
		type     : type,
		category : category
	    });
	}
    });
});
// }}}
// Admin -- Kategori Düzenle (POST) {{{
app.post('/yonetim/:type/kategori/:id/duzenle', function (req,res,next) {
    var type = req.params.type;
    var id   = req.params.id;
    var fields = {
	name : req.body.isim
    };

    Types.updateCategory(type,id,fields, function (err, category) {
	if (err) {
	    next(err);
	} else {
	    res.redirect('/yonetim/'+type+'/kategori/'+id);
	}
    });
});
// }}}

// Admin -- Yeni Ürün (FORM) {{{
app.get('/yonetim/:type/urun/yeni', function (req,res,next) {
    var type  = req.params.type;
    var ttype = type[0].toUpperCase() + type.substr(1);
    var catId = req.query.kategori;

    as.waterfall([
	function (callback) {
	    if (catId) {
		Category.findById(catId, function (err,category) {
		    callback(err, category);
		});
	    } else {
		callback(null, null);
	    }
	},
	function (category, callback) {
	    Types.allCategories(type, function (err,categories) {
		callback(err, category, categories);
	    });
	}
    ],function (err, category, categories) {
	if (err) {
	    next(err);
	} else {
	    if(category) 
		var title =
		    ttype+' - '+category.name+' - '+"Yeni Ürün";
	    else 
		var title = ttype + " - Yeni Ürün";
	    
	    
	    res.render('newProduct',{
		type        : type,
		categoryId  : (category ? category._id : null),
		categories  : categories,
		title       : title,
		product     : null,
		scripts     : [
		    'jquery',
		    'jquery.color',
		    'jquery.jcrop',
		    'newProduct'
		],
		styles      : [
		    'jquery.jcrop'
		]
	    });
	}
    });
});
// }}}
// Admin -- Yeni Ürün (POST) {{{

app.post('/yonetim/:type/urun/yeni', function (req,res,next) {

    var type = req.params.type;
    
    var imgdata_     = req.body.image.data;      // data/uri base64 encoded image data
    var category_    = req.body.category;   // category ObjectId
    var coords_      = req.body.coords;     // image cropping coordinats
    var product_     = {
	name         : req.body.name,
	description  : req.body.description.replace(/\r\n/g, "<br />")
    };

    as.waterfall ([
	function (callback) {
	    Types.saveProduct (type,category_, product_, function (err, product, category) {
		callback (err, product, category);
	    });
	},
	function (category, product, callback) {
	    Types.saveProductImage (type, product, imgdata_, coords_, function (err,product_) {
		callback (err,product_);
	    });
	}
    ], function (err, product) {
	if (err) {
	    console.log (err);
	    next(err);
	} else {
	    res.redirect('/yonetim/'+type+'/kategori/'+category_);
	}
    });
});

// }}}

// Admin -- Ürün Sil {{{
app.get('/yonetim/:type/urun/:id/sil', function (req,res,next) {
    var type = req.params.type;
    var id   = req.params.id;

    Types.removeProductFromId(type, id, function (err, category) {
	if (err) {
	    next(err);
	} else {
	    res.redirect('/yonetim/'+type+'/kategori/'+category._id);
	}
    });
});
// }}}

// Admin -- Ürün Düzenle (FORM) {{{
app.get('/yonetim/:type/urun/:id/duzenle', function (req,res,next) {
    var type = req.params.type;
    var pid   = req.params.id;
    
    as.waterfall([
	function (cb) {
	    Product.findById(pid, function (err, product) {
		cb(err,product);
	    });
	},
	function (product, cb) {
	    Types.allCategories(type, function (err, categories) {
		cb(err, categories, product);
	    });
	}
    ],function (err, categories, product) {
	if (err) {
	    next(err);
	} else {
	    var ttype = type[0].toUpperCase() + type.substr(1);
	    var title = ttype+' - '+product.name+' - '+"Düzeneleme";

	    product.description = product.description.replace(/<br \/>/g, "\r\n");
	    
	    res.render('newProduct',{
		type        : type,
		categoryId  : product.category+"",
		categories  : categories,
		title       : title,
		product     : product,
		scripts     : [
		    'jquery',
		    'jquery.color',
		    'jquery.jcrop',
		    'newProduct'
		],
		styles      : [
		    'jquery.jcrop'
		]
	    });
	}
    });
});
// }}}
// Admin -- Ürün Düzenleme (POST) {{{
app.post('/yonetim/:type/urun/:id/duzenle', function (req,res,next) {
    var type = req.params.type;
    var id   = req.params.id;

    var fields = {
	name        : req.body.name,
	description : req.body.description,
	category    : req.body.category,
    };

	try {
	    var imageChanged = (req.body.image.name.length ? true : false);
	} catch (e) {
		var imageChanged = false;
	}

    as.waterfall([
	function (cb) {
	    Product.findById(id, function (err, product) {
		cb(err, product);
	    });
	}, function (product, cb) {
	    if (fields.category != product.category.toString()) {
		Types.changeProductCategory(type, product, fields.category, function (err, p) {
		    cb(err,p);
		});
	    } else {
		cb(null, product);
	    }
	}, function (product, cb) {
	    product.name        = fields.name;
	    product.description = fields.description.replace(/\r\n/g, "<br />");
	    product.save(function (err) {
		cb(err, product);
	    });
	}, function (product, cb) {
	    if (imageChanged) {
			try {
				var imgd = req.body.image.data;
				var cord = req.body.coords; 

				Types.saveProductImage(type, product, imgd, cord, function (err, p) {
					cb(err, p)
				});
			} catch (errr) {
				cb(errr);
			}

	    } else {
		cb(null, product);
	    }	    
	}
    ],function (err, product) {
	if (err) {
	    next(err);
	} else {
	    res.redirect('/yonetim/'+type+'/kategori/'+product.category);
	}
    });
});
// }}}

// }}}


// }}}

app.listen(21054); 
// app.listen(3000);

