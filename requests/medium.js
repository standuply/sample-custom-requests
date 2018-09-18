const myCache = require('../util/my.node.cache');

const requestPromise = require('request-promise');

// Stub for error response
const errorMessage = require('../response-stubs/error');

//This function parses medium's API response
const processResponse = (rawData) => {
    const jsonString = rawData
        .substring(rawData.indexOf('{', rawData.indexOf('__APOLLO_STATE__')), rawData.lastIndexOf('}}<') + 2)
        .replace(/\\x3(c|e)/mgi, substring => `\\${substring}`);

    const data = JSON.parse(jsonString);

    const fields = [];

    for (let prop in data) {
        if (data.hasOwnProperty(prop)) {
            if (prop.startsWith('Post:')) {
                const post = data[prop];
                // Prepare fields array according to Slack attachment format
                fields.push({
                    title: post.title,
                    value: `<https://medium.com/p/${post.id}|Read>`,
                    short: false
                });
            }
        }
        if (fields.length >= 5) {
            break;
        }
    }

    return fields;
};

// This function gets last posts from medium.com and generates Slack attachment
module.exports = (req, res, next) => {
    let value = myCache.get('medium');
    if (value !== undefined) {
        res.json(value);
        return;
    }

    let uri = 'https://medium.com/topic/popular';

    const request = {
        method: 'GET',
        uri: uri,
        json: false,
        simple: false
    };

    const thumbUrl = 'https://medium.com/img/default-preview-image-v2.png';

    requestPromise(request)
        .then(data => {
            const fields = processResponse(data);
            if (fields === null) {
                throw 'parsing Medium';
            }

            // Make the Slack attachment - one object
            const result = {
                fallback: 'Medium - Most popular today',
                color: '#36a64f',
                title: 'Most popular today from Medium',
                title_link: uri,
                fields: fields,
                mrkdwn_in: ['text', 'fields'],
                thumb_url: thumbUrl,
                footer: 'Standuply',
                footer_icon: 'https://app.standuply.com/img/16.png',
                ts: Math.round(Date.now() / 1000)
            };

            myCache.set('medium', result);
            res.json(result);
        })
        .catch(error => {
            console.log('Medium error', error);
            res.json(errorMessage(error.toString()));
        });


};
