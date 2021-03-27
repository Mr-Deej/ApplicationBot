const { discord, client } = require('../index.js');
const appManager = require('../appmanager.js');

module.exports = {
    name: 'createticket',
    description: 'Create tickets',

    execute(message, args) {
        if (args.length >= 3) {
            var categoryName = args[1];
            categoryName = categoryName.replace('_', ' ');
            if (isValidCategory(categoryName)) {
                var name = args.shift();
                var category = client.channels.cache.get(args.shift());
                if (category == undefined) {
                    category = message.guild.channels.cache.find((channel) => {
                        return channel instanceof discord.CategoryChannel && channel.name === categoryName;
                    });
                }
                appManager.buildApp(name, category, getQuestionsArray(args), true, true);
                message.channel.send(`Created ticket successfully.`);
            } else {
                // Invalid submission channel
                message.reply(`${categoryName} is not a valid category name or ID!`);
            }
        } else {
            message.reply('there are not enough arguments! Make sure you are writing in the format name, category ID, questions');
        }

        function isValidCategory(categoryID) {
            var channel = message.guild.channels.cache.get(categoryID);
            if (channel == undefined) {
                channel = message.guild.channels.cache.find((channel) => {
                    return channel instanceof discord.CategoryChannel && channel.name === categoryID;
                });
            }
            return channel != undefined && channel instanceof discord.CategoryChannel;
        }

        function isID(categoryString) {
            return categoryString.match(discord.MessageMentions.CHANNELS_PATTERN);
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