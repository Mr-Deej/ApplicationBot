const { client, discord } = require('./index.js');
const database = require('./database.js');
// Maps guild to list of application that the guild has
client.apps = new discord.Collection();
// Maps a Discord user to their app response. They can only work on one app at a time
client.responses = new discord.Collection();
// Maps a Discord user to all of their cached finished apps (no response from admin, accepted, or denied)
client.finishedApps = new discord.Collection();
client.ticketResponses = new discord.Collection();

module.exports = {

    getApps(guild) {
        return client.apps.get(guild);
    },

    getApp(guild, name, isTicket) {
        return this.getApps(guild).find((value) => {
            if (isTicket) {
                if (value.type === 'ticket') {
                    return value.name == name;
                }
            } else {
                if (value.type !== 'ticket') {
                    return value.name == name;
                }
            }
        });
    },

    getOpenApp(user, isTicket) {
        if (!isTicket) {
            return client.responses.get(user);
        } else {
            return client.ticketResponses.get(user);
        }
    },

    getFinishedApp(user, application) {
        if (client.finishedApps.has(user)) {
            var userApps = client.finishedApps.get(user);
            return userApps.find(value => value.app === application);
        }
    },

    getOwner(application) {
        var responses = client.responses;
        if (application.app.type == 'ticket') {
            responses = client.ticketResponses;
        }
        var applicant = responses.findKey((listApp) => {
            if (listApp == application) {
                return true;
            }
        });
        return applicant;
    },

    findTicketByChannel(channel) {
        return client.ticketResponses.find((openApp) => {
            if (openApp.channel == channel) {
                return true;
            }
        });
    },

    findTicketByID(id) {
        return client.ticketResponses.find((openApp) => {
            if (openApp.id == id) {
                return true;
            }
        });
    },

    addAuthorisedRole(app, role) {
        if (app.roles != undefined) {
            app.roles.push(role);
        } else {
            app.roles = [role];
        }
    },

    startApp(applicant, application) {
        // Regular app
        if (application.type != 'ticket') {
            client.responses.set(applicant, {
                app: application,
                responses: [],
                status: 0
            });
        } else { // Ticket
            client.ticketResponses.set(applicant, {
                app: application,
                responses: [],
                status: 0
            });
        }
    },

    addResponse(applicant, isTicket, response) {
        var openApp = this.getOpenApp(applicant, isTicket);
        var responses = openApp.responses;
        responses[responses.length] = response;
        openApp.responses = responses;
        if (!isTicket) {
            client.responses.set(applicant, openApp);
        } else {
            client.ticketResponses.set(applicant, openApp);
        }
    },

    numResponsesNeeded(applicant, isTicket) {
        var openApp = this.getOpenApp(applicant, isTicket);
        var questionAmount = openApp.app.questions.length;
        var responseAmount = openApp.responses.length;
        return questionAmount - responseAmount;
    },

    finishApp(applicant, sendIn, isTicket, toDB) {
        if (sendIn) {
            var openApp = this.getOpenApp(applicant, isTicket);
            openApp.status = 1;
            // If user already has some completed apps, add to the array. Otherwise, initialise an array
            if (client.finishedApps.has(applicant)) {
                var appsArray = client.finishedApps.get(applicant);
                appsArray.push(openApp);
                client.finishedApps.set(applicant, appsArray);
            } else {
                client.finishedApps.set(applicant, [openApp]);
            }
            if (toDB) {
                database.saveResponses(applicant, openApp, 1);

                if (!isTicket) {
                    var formattedResponses = openApp.responses.map((value, index) => {
                        return `**${openApp.app.questions[index]}**: ${value}`;
                    });
                    formattedResponses.unshift(`**Discord**: ${this.getOwner(openApp)}`);
                    openApp.app.submission_channel.send(formattedResponses).then(message => {
                        var filter = (reaction, user) => {
                            return reaction.emoji.name === '✅' || reaction.emoji.name === '❌';
                        }
                        message.awaitReactions(filter, {max: 1}).then(collected => {
                            var emoji = collected.first().emoji.name;
                            var dbApp = openApp;
                            if (emoji === '✅') {
                                openApp.status = 2;
                                database.setResponseStatus(applicant, dbApp, 2);
                                applicant.send(`Congratulations, your application **${openApp.app.name}** has been accepted! Please contact an appropriate user to continue.`)
                                    .catch(() => collected.first().message.channel.send('Couldn\'t send message to user; they likely have their DMs off'));
                            } else {
                                openApp.status = 3;
                                database.setResponseStatus(applicant, dbApp, 3);
                                applicant.send(`Unfortunately, your application **${openApp.app.name}** has been denied.`)
                                    .catch(() => collected.first().message.channel.send('Couldn\'t send message to user; they likely have their DMs off'));
                            }
                        });
                    });
                    client.responses.delete(applicant);
                } else {
                    var id = client.ticketResponses.reduce((accumulator, currentValue) => {
                        if (currentValue.id != undefined) {
                            if (accumulator < currentValue.id) {
                                return currentValue.id;
                            }
                        } else {
                            return accumulator;
                        }
                    }, -1);
                    id = id + 1;
                    var perms;
                    if (openApp.app.roles != undefined) {
                        perms = openApp.app.roles.map((value) => {
                            return {id: value.id,
                                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                            }
                        });
                    }
                    var channel = openApp.app.submission_channel.guild.channels.create(`${id}`, {
                        parent: openApp.app.submission_channel,
                        permissionOverwrites: perms
                    });
                    channel.then((channel) => {
                        openApp.channel = channel;
                        openApp.id = id;
                        var formattedResponses = openApp.responses.map((value, index) => {
                            return `**${openApp.app.questions[index]}**: ${value}`;
                        });
                        formattedResponses.unshift(`**Discord**: ${applicant}`);
                        channel.send(formattedResponses);
                    });
                    client.ticketResponses.delete(applicant);
                }
            }
        }
        //client.responses.delete(applicant);
        //client.ticketResponses.delete(applicant);
    },

    closeTicket(ticket) {
        ticket.channel.delete();
        var applicant = this.getOwner(ticket);
        client.ticketResponses.delete(applicant);
        database.setResponseStatus(applicant, ticket, 2);
    },

    closeApp(app) {
        var owner = client.finishedApps.findKey(array => array.indexOf(app) > -1);
        var apps = client.finishedApps.get(owner);
        var index = apps.indexOf(app);
        apps.splice(index, 1);
    },

    buildApp(name, submissionChannel, questions, isTicket, addToDB) {
        var app = {
            name: name,
            submission_channel: submissionChannel,
            questions: questions
        };
        if (isTicket) {
            app.type = 'ticket';
        }
        // adding app to the right guild
        if (client.apps.has(submissionChannel.guild)) {
            var apps = this.getApps(submissionChannel.guild);
            apps[apps.length] = app;
            client.apps.set(submissionChannel.guild, apps);
        } else {
            client.apps.set(submissionChannel.guild, [app]);
        }
        if (addToDB) {
            database.add(app);
        }
        return app;
    },

    deleteApp(app, fromDB) {
        var guild = app.submission_channel.guild;
        var appArray = this.getApps(guild);
        var index = appArray.indexOf(app);
        appArray.splice(index, 1);
        client.apps.set(guild, appArray);
        if (fromDB) {
            database.delete(app);
        }
    }
}