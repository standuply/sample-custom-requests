const myCache = require('../util/my.node.cache');

const parser = require('rss-url-parser');

// Stub for error response
const errorMessage = require('../response-stubs/error');

// This function parses techcrunch's JSON
const parseTechcrunchPosts = (data) => {

        const fields = [];

        for (let post of data) {
            // Prepare fields array according to Slack attachment format
            fields.push({
                title: post.title,
                value: `<${post.origlink}|Read>`, // `${readString}   :speech_balloon:  <${post.comments}| Comments>`,
                short: false
            });

            if (fields.length >= 5) {
                break;
            }
        }
        return fields;


};

// This function gets json result from techcrunch
module.exports = (req, res, next) => {

    let value = myCache.get('techcrunch');
    if (value !== undefined) {
        res.json(value);
        return;
    }

    const thumbUrl = 'https://tctechcrunch2011.files.wordpress.com/2014/04/tc-logo.jpg';

    parser('http://feeds.feedburner.com/TechCrunch/')
        .then((data) => {
            const fields = parseTechcrunchPosts(data);
            if (fields === null) {
                throw 'parsing RSS JSON';
            }

            // Make the Slack attachment - one object
            const result = {
                fallback: 'Techcrunch latest posts.',
                color: '#36a64f',
                pretext: 'Latest posts from Techcrunch',
                fields: fields,
                mrkdwn_in: ['text', 'fields'],
                thumb_url: thumbUrl,
                footer: 'Standuply',
                footer_icon: 'https://app.standuply.com/img/16.png',
                ts: Math.round(Date.now() / 1000)
            };


            myCache.set('techcrunch', result);
            res.json(result);
        })
        .catch(error => {
            console.log('Techcrunch error', error);
            res.json(errorMessage(error.toString()));
        });

};
