//const { client, discord, apps, responses } = require('../index.js');
//const { discord } = require('../index.js');
const appManager = require('../appmanager.js');

module.exports = {
    name: 'apply',
    description: 'Used to get started in filling out an application',

    execute(message, args) {
        if (args.length > 0) {
            var app = appManager.getApp(message.channel.guild, args[0], false);
            if (appManager.getOpenApp(message.author, true) == null && appManager.getOpenApp(message.author, false) == null && appManager.getFinishedApp(message.author, app) == null) {
                if (app != undefined) {
                    // if appName is a valid application...
                    message.author.send(`Hello! You will respond to the application questions for ${args[0]} here. Answer to the best of your abilities.\nQuestion 1: ${app.questions[0]}`)
                        .then(() => {
                            message.channel.send(`I\'ve sent you a DM to get started on applying for ${args[0]}`);
                            // set a new response array that's empty
                            appManager.startApp(message.author, app);
                        })
                        .catch(() => message.reply('please enable DMs so we can start the application process.'));
                } else {
                    message.reply(`I could not find an application matching ${args[0]}`);
                }
            } else {
                message.reply('you already have an app open!');
            }
        }
    }
}