const { client, discord, config } = require('./index.js');
const appManager = require('./appmanager.js');

// They are in DMs with the bot and responding to an application question
module.exports = {

    execute(message) {
        var applicant = message.author;
        var isTicket = false;
        var openApp = appManager.getOpenApp(applicant, isTicket);
        // Not an app, but might be a ticket
        if (openApp == null) {
            isTicket = true;
            openApp = appManager.getOpenApp(applicant, isTicket);
        }

        if (openApp != null) {
            // Cancel the application
            if (message.content.startsWith(config.prefix + 'cancel')) {
                appManager.finishApp(applicant, false, isTicket, true);
                message.reply('I\'ve cancelled your application!');
            } else {
                // Record reply
                appManager.addResponse(applicant, isTicket, message.content);
                var numNeeded = appManager.numResponsesNeeded(applicant, isTicket);
                // Answered all the questions, wrap up application
                if (numNeeded == 0) {
                    appManager.finishApp(applicant, true, isTicket, true);
                    message.reply('I\'ve submitted your app. Good luck!');
                } else {
                    // Ask the next question
                    var questions = openApp.app.questions;
                    message.channel.send(questions[questions.length - numNeeded]);
                }
            }
        }
    }
}