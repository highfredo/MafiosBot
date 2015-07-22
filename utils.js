'use strict';

var _ = require('lodash'),
	glob = require('glob'),
    mime = require('mime'),
    URL = require('url'),
    path = require('path'),
    stream = require('stream'),
    TelegramBot = require('node-telegram-bot-api'),
    conf = require('./conf.json'),
    mimeTypes = require('./mimeTypes.json');


/*
* Init the Bot
*/   
module.exports.loadBot = function() {
	var bot = new TelegramBot(conf.bot.token, conf.bot.opts);
	bot.plugins = [];
	bot.conf = conf;

	// Reply functions
	bot.reply = function (chatId) {

	    return {
	        forwardMessage: function(fromChatId, messageId) {
	            return bot.forwardMessage(chatId, fromChatId, messageId)
	        },
	        sendChatAction: function(action) {
	            return bot.sendChatAction(chatId, action);
	        },
	        send: function(data, options) {
	            var funtionType = utils.lookupFunctionType(data, options);

	            if(funtionType === 'message') {
	                return this.sendMessage(data, options);
	            } else if(funtionType === 'photo') {
	                return this.sendPhoto(data, options);
	            } else if(funtionType === 'audio') {
	                return this.sendAudio(data, options);
	            } else if(funtionType === 'document') {
	                return this.sendDocument(data, options);
	            } else if(funtionType === 'sticker') {
	                return this.sendSticker(data, options);
	            } else if(funtionType === 'video') {
	                return this.sendVideo(data, options);
	            } else if(funtionType === 'location') {
	                return this.sendLocation(data.lat, data.lng, options);
	            } else {
	                throw new Error('Not valid FunctionType');
	            }
	        },
	        sendMessage: function(text, options) {
	            return bot.sendMessage(chatId, text, options);
	        },
	        sendPhoto: function(photo, options) {
	            return bot.sendPhoto(chatId, photo, options);
	        },
	        sendAudio: function(audio, options) {
	            return bot.sendAudio(chatId, audio, options);
	        },
	        sendDocument: function(document, options) {
	            return bot.sendDocument(chatId, document, options);
	        },
	        sendSticker: function(sticker, options) {
	            return bot.sendSticker(chatId, sticker, options);
	        },
	        sendVideo: function(video, options) {
	            return bot.sendVideo(chatId, video, options);
	        },
	        sendLocation: function(latitude, longitude, options) {
	            return bot.sendLocation(chatId, latitude, longitude, options);
	        }
	    }
	};


	bot.loadPlugin = function(pluginPath) {
	    var plugin = require(path.resolve(pluginPath))(bot, conf);

	    // Default match function
	    if(!plugin.match) {
	        plugin.match = function (msg) {
	            return msg.command.name === plugin.name;
	        };
	    }

	    bot.plugins.push(plugin);

	    return plugin;
	};


	bot.exec = function(plugin, msg) {
		return plugin.exec(msg, bot.reply(msg.chat.id))
	        .catch(function(err) {
	            console.log(err);
	            bot.sendMessage(msg.chat.id, "Error procesando su petición");
	        });
	}

	return bot;
}

/**
 * Lookup for type (phono, audio, sticker, video, document, location or message)
 */
module.exports.lookupFunctionType = function(data, options) {
	var params = options || {};

    if(params.type)
        return params.type;

    var isFile = params.isFile;
    if(!isFile && typeof data === 'string') {
        return "message";
    }

    if (isFile || data instanceof stream.Stream) {
        var fileName = URL.parse(path.basename(data.path)).pathname;
        var mimeType = params.mime || mime.lookup(fileName);

        if (_.includes(mimeTypes.photo, mimeType))   return "photo";
        if (_.includes(mimeTypes.audio, mimeType))   return "audio";
        if (_.includes(mimeTypes.sticker, mimeType)) return "sticker";
        if (_.includes(mimeTypes.video, mimeType))   return "video";

        return "document";
    }

    if(data instanceof Object && data.lat && data.lng) {
        return "location";
    }
};

/**
 * Parse input command
 */
module.exports.parseCommand = function(txt) {
	var splitText = txt.split(' ');
	return {
		name: splitText.shift().substr(1).split('@')[0],
		params: splitText,
		text: splitText.join(' ')
	}
};


/**
 * Get files by glob patterns, from meanjs project
 */
module.exports.getGlobbedFiles = function(globPatterns, removeRoot) {
	// For context switching
	var _this = this;

	// URL paths regex
	var urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');

	// The output array
	var output = [];

	// If glob pattern is array so we use each pattern in a recursive way, otherwise we use glob 
	if (_.isArray(globPatterns)) {
		globPatterns.forEach(function(globPattern) {
			output = _.union(output, _this.getGlobbedFiles(globPattern, removeRoot));
		});
	} else if (_.isString(globPatterns)) {
		if (urlRegex.test(globPatterns)) {
			output.push(globPatterns);
		} else {
			var files = glob.sync(globPatterns);

			if (removeRoot) {
				files = files.map(function(file) {
					return file.replace(removeRoot, '');
				});
			}

			output = _.union(output, files);
		}
	}

	return output;
};