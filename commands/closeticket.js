const appManager = require('../appmanager.js');

module.exports = {
    name: 'closeticket',
    description: 'Command used to close ticket',

    execute(message, args) {
        var channel = message.channel;
        var ticket = appManager.findTicketByChannel(channel);
        var owner = appManager.getOwner(ticket);
        owner.dmChannel.send('Your ticket has been closed.');
        appManager.closeTicket(ticket);
    }
}