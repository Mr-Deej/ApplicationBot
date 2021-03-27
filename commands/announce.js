const { discord, client } = require('../index.js');

module.exports = {
    name: 'announce',
    description: 'Have the bot make an announcement in a channel',

    execute(message, args) {
        if (args.length >= 3) {
            var channelID = args.shift();
            var channel = channelID.match(discord.MessageMentions.CHANNELS_PATTERN);
            // found the channel ID
            if (channel != null) {
                channel = channel[0].slice(2, -1);
                channel = message.guild.channels.cache.get(channel);
                if (channel != undefined) {
                    var announcement = args.join(' ');
                    var embed = new discord.MessageEmbed()
                        .setColor('#cc33ff')
                        .setDescription(announcement);
                    channel.send(embed);
                } else {
                    message.reply(`Invalid channel ${channelID} supplied!`);
                }
            } else {
                message.reply(`Invalid channel ${channelID} supplied!`);
            }
        } else {
            message.reply('that is too few arguments!');
        }
    }
}