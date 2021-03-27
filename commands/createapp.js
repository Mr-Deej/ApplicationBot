const { discord, client } = require('../index.js');
const appManager = require('../appmanager.js');

module.exports = {
    name: 'createapp',
    description: 'Create applications',

    execute(message, args) {
        if (args.length >= 3) {
            var channel = args[1];
            if (isValidChannel(getChannelID(channel))) {
                var name = args.shift();
                channel = client.channels.cache.get(getChannelID(args.shift()));
                appManager.buildApp(name, channel, getQuestionsArray(args), false, true);
                message.channel.send(`Created application successfully.`);
            } else {
                // Invalid submission channel
                message.reply(`${channel} is not a valid channel!`);
            }
        } else {
            message.reply('there are not enough arguments! Make sure you are writing in the format name, channel, questions');
        }

        function getChannelID(channelString) {
            if (channelString.match(discord.MessageMentions.CHANNELS_PATTERN)) {
                channelString = channelString.slice(2, -1);
            }
            return channelString;
        }

        function isValidChannel(channelID) {
            return message.guild.channels.cache.get(channelID) != undefined;
        }

        function getQuestionsArray(fromArgs) {
            fromArgs = fromArgs.join(' ');
            var questions = fromArgs.split(/ *\n/g);
            questions.forEach((value, index, array) => {
                array[index] = value.trim();
                if (value.length == 0) {
                    array.splice(index, 1);
                }
            });
            return questions;
        }
    }
}