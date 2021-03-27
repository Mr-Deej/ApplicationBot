module.exports = {
    name: 'purge',
    description: 'Command that purges messages in a channel',

    execute(message, args) {
        if (args.length > 0) {
            var amount = args.shift();
            amount = parseInt(amount);
            if (!isNaN(amount)) {
                message.channel.bulkDelete(amount)
                    .then(messages => message.reply(`deleted the last ${messages.size} messages!`));
            } else {
                message.reply('invalid number given!');
            }
        }
    }
}