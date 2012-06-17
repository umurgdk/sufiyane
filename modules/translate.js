var TRANS_LIST = {
	"Unkown image format" : "Yanlış resim formatı. Lütfen jpg veya png resmi gönderiniz."
};

exports.translate = function   (msg) {
	return TRANS_LIST[msg] || msg;
}
