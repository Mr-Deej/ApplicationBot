const guildSettings = require('../guildsettings.js');

module.exports = {
    name: 'suggest',
    description: 'Send an official, formatted suggestion to staff',

    execute(message, args) {
        if (args.length > 0) {
            args.unshift('**Suggestion:** ');
            var urls = message.attachments.map(attachment => attachment.url);
            if (urls.length > 0) {
                urls.unshift('\n**Attachments:** ');
                urls = urls.join('\n');
                args.push(urls);
            }
            var suggestion = args.join(' ');
            var channel = guildSettings.getSuggestionChannel(message.guild);
            if (channel == undefined) {
                message.reply('it doesn\'t look like this server is accepting suggestions');
                message.delete();
            } else {
                channel.send(suggestion);
            }
        } else {
            message.reply('please write your suggestion after the command.');
        }
    }
}