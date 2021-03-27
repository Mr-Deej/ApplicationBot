const { discord, client } = require('../index.js');
const appManager = require('../appmanager.js');

module.exports = {
    name: 'addrole',
    description: 'Add a role to an app or ticket that can view them',
    
    execute(message, args) {
        if (args.length >= 3) {
            var type = args.shift();
            var name = args.shift();
            var role = getRoleID(args.shift());
            if (type === 'ticket' || type === 'app') {
                if (isValidRole(role)) {
                    role = message.guild.roles.cache.get(role);
                    if (type === 'ticket') {
                        type = true;
                    } else {
                        type = false;
                    }
                    var app = appManager.getApp(message.guild, name, type);
                    appManager.addAuthorisedRole(app, role);
                    // is an app
                    if (!type) {
                        app.submission_channel.overwritePermissions([{
                            id: role,
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                        }]);
                    }
                    message.reply('Role added to app');
                } else {
                    message.reply(`Invalid role ${role} given.`);
                }
            } else {
                message.reply(`Invalid role ${role} given.`);
            }
        }

        function getRoleID(roleString) {
            if (roleString.match(discord.MessageMentions.ROLES_PATTERN)) {
                roleString = roleString.slice(3, -1);
            }
            return roleString;
        }

        function isValidRole(roleID) {
            return message.guild.roles.cache.get(roleID) != undefined;
        }
    }
}