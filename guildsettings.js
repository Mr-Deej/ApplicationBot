const { client, discord } = require('./index.js');
client.suggestionChannels = new discord.Collection();
module.exports = {

    getSuggestionChannel(guild) {
        return client.suggestionChannels.get(guild);
    },

    setSuggestionChannel(guild, channel) {
        if (channel === 'clear') {
            client.suggestionChannels.delete(guild);
        } else {
            client.suggestionChannels.set(guild, channel);
        }
    }
}