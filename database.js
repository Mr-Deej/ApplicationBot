const { discord, config } = require('./index.js');
const mysql = require('mysql');
const appTable = 'applications';
const responseTable = 'responses';

module.exports = {
    load() {
        var connection = mysql.createConnection(config.database);
        connection.connect((error) => {
            if (error) throw error;
            console.log('Database connected succesfully!');

            var sql = `SELECT * FROM ${appTable}`;

            connection.query(sql, (err, result, fields) => {
                if (err) throw err;

                var appManager = require('./appmanager.js');
                var { client, discord } = require('./index.js');
                // loading in the apps
                var ids = new discord.Collection();
                result.forEach((value) => {
                    var isTicket;
                    if (value.is_ticket) {
                        isTicket = 'ticket';
                    }
                    var channel = client.channels.cache.get(value.channel_id);
                    var questions = value.questions.split('|');
                    var app = appManager.buildApp(value.name, channel, questions, isTicket, false);
                    ids.set(value.id, app);
                });

                sql = `SELECT * FROM ${responseTable} WHERE status = 0 OR status = 1`;
                // loading in application responses
                connection.query(sql, (error, result2) => {
                    if (error) throw error;

                    result2.forEach((value) => {
                        var applicant = client.users.cache.get(value.user_id);
                        var responses = value.responses.split('|');
                        var app = ids.get(value.app_id);
                        var isTicket = false;
                        if (app.type === 'ticket') {
                            isTicket = true;
                        }
                        appManager.startApp(applicant, app);
                        responses.forEach((value2) => {
                            appManager.addResponse(applicant, isTicket, value2);
                            if (appManager.numResponsesNeeded(applicant, isTicket) === 0) {
                                appManager.finishApp(applicant, true, isTicket, false);
                            }
                        });
                    });
                });
            });
        });
    },

    add(app) {
        var connection = mysql.createConnection(config.database);
        connection.connect((error) => {
            if (error) throw error;
            var isTicket = 0;
            if (app.type === 'ticket') {
                isTicket = 1;
            }
            var questions = app.questions.join('|');
            var sql = `INSERT INTO ${appTable} (name, channel_id, questions, is_ticket, guild_id) VALUES (${connection.escape(app.name)}, ${app.submission_channel.id}, ${connection.escape(questions)}, ${isTicket}, ${app.submission_channel.guild.id})`;
            connection.query(sql, (err, result) => {
                if (err) throw err;

                console.log('Record inserted.');
            });
        });
    },

    delete(app) {
        var connection = mysql.createConnection(config.database);
        connection.connect((error) => {
            if (error) throw error;
            var isTicket = 0;
            if (app.type === 'ticket') {
                isTicket = 1;
            }
            var sql = `DELETE FROM ${appTable} WHERE name = '${app.name}' AND is_ticket = ${isTicket} AND guild_id = '${app.submission_channel.guild.id}'`;
            connection.query(sql, (err, result) => {
                if (err) throw err;

                console.log('Record removed.');
            });
        });
    },

    saveResponses(applicant, response, status) {
        var connection = mysql.createConnection(config.database);
        //var appManager = require('./appmanager.js');
        var applicantID = applicant.id;
        connection.connect((error) => {
            if (error) throw error;

            //var appManager = require('./appmanager.js');
            //var { client } = require('./index.js');

            //var applicantID = appManager.getOwner(response).id;
            var responses = response.responses.join('|');
            var isTicket = 0;
            if (response.app.type === 'ticket') {
                isTicket = 1;
            }
            var sql = `SELECT id FROM ${appTable} WHERE name = ${connection.escape(response.app.name)} AND channel_id = '${response.app.submission_channel.id}' AND is_ticket = ${isTicket}`;
            connection.query(sql, (error, result) => {
                if (error) throw error;

                var appID = result[0].id;
                sql = `INSERT INTO ${responseTable} (user_id, app_id, status, responses) VALUES ('${applicantID}', ${appID}, ${status}, ${connection.escape(responses)})`;
                console.log(sql);
                connection.query(sql, (error, result) => {
                    if (error) throw error;

                    console.log('Response saved.');
                });
            });
        });
    },

    loadResponse(userID, guildID, appName, isTicket) {
        var connection = mysql.createConnection(config.database);
        connection.connect((error) => {
            if (error) throw error;

            var sql = `SELECT id FROM ${appTable} WHERE name = '${appName}' AND guild_id = '${guildID}' AND is_ticket = ${isTicket}`;
            connection.query(sql, (error, result) => {
                if (error) throw error;

                var appID = result[0].id;
                sql = `SELECT responses FROM ${responseTable} WHERE user_id = '${userID}' AND app_id = ${appID}`;
                connection.query(sql, (error, result) => {
                    if (error) throw error;

                    console.log(result[0].responses);
                });
            });
        });
    },

    setResponseStatus(applicant, openApp, status) {
        var connection = mysql.createConnection(config.database);
        connection.connect((error) => {
            if (error) throw error;

            var isTicket = 0;
            if (openApp.app.type === 'ticket') {
                isTicket = 1;
            }
            var sql = `SELECT id FROM ${appTable} WHERE name = ${connection.escape(openApp.app.name)} AND channel_id = '${openApp.app.submission_channel.id}' AND is_ticket = ${isTicket}`;
            connection.query(sql, (error, result) => {
                if (error) throw error;
                var appManager = require('./appmanager.js');
                var id = result[0].id;
                sql = `UPDATE ${responseTable} SET status = ${status} WHERE user_id = '${applicant.id}' AND app_id = ${id} AND responses = '${openApp.responses.join('|')}'`;
                connection.query(sql, (error, result) => {
                    if (error) throw error;

                    console.log('Status updated.');
                });
                // app was accepted or denied, remove from open apps
                // would prefer to do this in app manager but if I do, runs before sql stuff, leaving this method with an undefined open app
                if (isTicket != 1 && (status !== 0 || status !== 1)) {
                    appManager.closeApp(openApp);
                }
            });
        });
    }
}