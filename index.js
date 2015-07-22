'use strict';

var _ = require('lodash'),
    path = require('path'),
    utils = require('./utils');



/**
 *   MAIN
 **/

//Init the bot
var bot = utils.loadBot();

// Print Bot Name
bot.getMe().then(function (me) {
    console.log('Hi my name is %s!', me.username);
});

// Load Plugins
utils.getGlobbedFiles('./plugins/**/*.js').forEach(function(pluginPath) {
    var plugin = bot.loadPlugin(pluginPath);
    console.log(plugin.name + " loaded.");
});

// On message
bot.on('message', function (msg) {
    console.log('mensaje recibido');
    /* {
         message_id: 76,
         from: { id: 318965, first_name: 'Highfredo', username: 'highfredo' },
         chat: { id: 318965, first_name: 'Highfredo', username: 'highfredo' },
         date: 1437060150,
         text: '/echo hello word'
     } */

    // Parse msg text
    if(_.startsWith(msg.text, '/')) {
        msg.command = utils.parseCommand(msg.text);
        console.log(msg);
    }


    // Look for plugin
    var foundPlugin = false;
    _.forEach(bot.plugins, function(plugin, index) {
        if(plugin.match(msg)) {
            foundPlugin = true;
            console.log(plugin.name + " valid.");
            bot.exec(plugin, msg);
            return false;
        }
    });

    if(!foundPlugin) {
        console.log("No valid plugin found")
    }
});