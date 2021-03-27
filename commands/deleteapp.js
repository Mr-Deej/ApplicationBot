const appManager = require('../appmanager.js');

module.exports = {
    name: 'deleteapp',
    description: 'Delete an application so people can no longer apply for it',

    execute(message, args) {
        if (args.length >= 1) {
            var name = args.shift();
            var app = appManager.getApp(message.guild, name, false);
            appManager.deleteApp(app, true);
            message.reply('app deleted');
        }
    }
}