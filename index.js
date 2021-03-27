const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();
client.commands = new Discord.Collection();
client.apps = new Discord.Collection();
client.responses = new Discord.Collection();
const config = require('./config.json');

exports.client = client;
exports.discord = Discord;
exports.apps = client.apps;
exports.responses = client.responses;
exports.config = config;

const reply = require('./appreplying.js');
const database = require('./database.js');

// get all command files in the commands folder and remove anything that isn't a JavaScript file
const cmdFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// loop through all the cmd files and "register" them into the collection
for (const file of cmdFiles) {
    const cmd = require(`./commands/${file}`)
    client.commands.set(cmd.name, cmd);
}

// command logic
client.on('message', message => {
    if (message.author.bot) return;
    // Possibly a reply
    if (message.channel instanceof Discord.DMChannel) {
        reply.execute(message);
        return;
    }

    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).split(/ +/);
    const cmdName = args.shift().toLowerCase();

    if (!client.commands.has(cmdName)) return;

    const cmd = client.commands.get(cmdName);
    try {
        cmd.execute(message, args);
    } catch(error) {
        console.error(error);
        message.reply('Uh oh! I messed up running that command somewhere 😅');
    }
});

client.once('ready', () => {
    console.log('Ready!');
    database.load();
});

client.login(config.token);