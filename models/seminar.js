var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;

exports.SeminarModel = new Schema({
    name     : String,
    active   : {type: Boolean, default:false},
    days     : {
	pazartesi : {
	    active: {type:Boolean, default:false},
	    start : {type: String, default: ''},
	    end   : {type: String, default: ''}
	},
	sali      : {
	    active: {type:Boolean, default:false},
	    start : {type: String, default: ''},
	    end   : {type: String, default: ''}
	},
	carsamba  : {
	    active: {type:Boolean, default:false},
	    start : {type: String, default: ''},
	    end   : {type: String, default: ''}
	},
	persembe  : {
	    active: {type:Boolean, default:false},
	    start : {type: String, default: ''},
	    end   : {type: String, default: ''}
	},
	cuma  : {
	    active: {type:Boolean, default:false},
	    start : {type: String, default: ''},
	    end   : {type: String, default: ''}
	},
	cumartesi : {
	    active: {type:Boolean, default:false},
	    start : {type: String, default: ''},
	    end   : {type: String, default: ''}
	},
	pazar  : {
	    active: {type:Boolean, default:false},
	    start : {type: String, default: ''},
	    end   : {type: String, default: ''}
	}
    },
    text      : String,
    shortText : {type: String, default: ""}
});


mongoose.model('Seminar', exports.SeminarModel);