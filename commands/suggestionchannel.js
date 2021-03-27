const { discord, client } = require('../index.js');
const guildSettings = require('../guildsettings.js');

module.exports = {
    name: 'suggestionchannel',
    description: 'Sets or removes designated suggestion channel',

    execute(message, args) {
        if (args.length > 0) {
            var channel = args[0];
            if (channel !== 'clear') {
                if (channel.match(discord.MessageMentions.CHANNELS_PATTERN)) {
                    channel = message.guild.channels.cache.get(channel.slice(2, -1));
                    if (channel != undefined) {
                        guildSettings.setSuggestionChannel(message.guild, channel);
                        message.reply(`set suggestions to send in channel ${channel}`);
                    }
                } else {
                    message.reply(`invalid channel name ${channel} given`);
                }
            } else { // Clearing suggestion channel
                guildSettings.setSuggestionChannel(message.guild, 'clear');
                message.reply('removed suggestion channel.');
            }
        } else {
            message.reply('please input a channel or \'clear\' after the command.');
        }
    }
}