const appManager = require('../appmanager.js');

module.exports = {
    name: 'deleteticket',
    description: 'Delete a ticket so that users may no longer open this kind of ticket',

    execute(message, args) {
        if (args.length >= 1) {
            var name = args.shift();
            var app = appManager.getApp(message.guild, name, true);
            appManager.deleteApp(app, true);
            message.reply('ticket deleted');
        }
    }
}