const appManager = require('../appmanager.js');

module.exports = {
    name: 'openticket',
    description: 'Command used to open a new ticket',

    execute(message, args) {
        if (args.length > 0) {
            // does not already have an open app or ticket
            if (appManager.getOpenApp(message.author, true) == null && appManager.getOpenApp(message.author, false) == null) {
                var ticket = appManager.getApp(message.channel.guild, args[0], true);
                if (ticket != undefined) {
                    // if appName is a valid application...
                    message.author.send(`Hello! You will respond to the ticket questions for ${args[0]} here, and then we'll open up a channel between you and involved roles.\nQuestion 1: ${ticket.questions[0]}`)
                        .then(() => {
                            message.channel.send(`I\'ve sent you a DM to get started on a ticket for ${args[0]}`);
                            // set a new response array that's empty
                            appManager.startApp(message.author, ticket);
                        })
                        .catch(() => message.reply('please enable DMs so we can start the application process.'));
                } else {
                    message.reply(`I could not find a ticket matching ${args[0]}`);
                }
            } else {
                message.reply('please close or submit the current app or ticket before creating a new one.');
            }
        }
    }
}