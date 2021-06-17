const fs = require('fs');
const urlsafeBase64 = require('urlsafe-base64');
const vapid = require('./vapid.json');
const webpush = require('web-push');

let subscriptions = require('./subs-db.json');

webpush.setVapidDetails(
    'mailto:enriquemarin_sierra@hotmail.com',
    vapid.publicKey,
    vapid.privateKey
);

module.exports.getKey = () => urlsafeBase64.decode(vapid.publicKey);

module.exports.addSubscription = (subscription) => {
    subscriptions.push(subscription);
    // console.log(subscriptions);
    fs.writeFileSync(`${__dirname}/subs-db.json`, JSON.stringify(subscriptions));
};

module.exports.sendPush = (post) => {

    console.log('Sending Push Notifications');

    const notificationsSent = [];

    subscriptions.forEach((subscription, i) => {

        const pushProm = webpush.sendNotification(subscription, JSON.stringify(post))
            .then(console.log('Notification sent successfully'))
            .catch(err => {

                console.log('Failure notification');
                if (err.statusCode === 410) { // GONE: no longer exists
                    subscriptions[i].remove = true;
                }
            });

        notificationsSent.push(pushProm);
    });

    Promise.all(notificationsSent)
        .then(() => {

            subscriptions = subscriptions.filter(subs => !subs.remove);
            fs.writeFileSync(`${__dirname}/subs-db.json`, JSON.stringify(subscriptions));
        });
};