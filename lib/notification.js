var fcm = require('node-gcm');

var constant = require('../config/globalConstant');

async function sendNotification(data, regTokens){
    var message = new fcm.Message({
        contentAvailable: true,
        priority: 'high',
        timeToLive: 60 * 60 * 24,
        notification: {
            title: data.NotificationSubject,
            body: data.NotificationContent
        },
        data: data
    });

    var sender = new fcm.Sender(constant.FIREBASE_SERVER_KEY);
    sender.send(message, { registrationTokens: regTokens }, async function (err, response) {
        if (err)
            console.error(JSON.stringify(err));
        else {
            return { status: 200, message: 'Notification sent' }
        }
    });
}

module.exports = {
    sendNotification
}