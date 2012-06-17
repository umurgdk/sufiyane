var as = require('async');

as.waterfall([
    function (callback) {
	callback(null,'a');
    },
    function (val, callback) {
	callback(null, val + 's');
    }
], function (err, val) {
    console.log(val);
});