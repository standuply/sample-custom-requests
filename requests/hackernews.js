const NodeCache = require("node-cache");
const myCache = new NodeCache({stdTTL: 100, checkperiod: 120});

const hn = require('node-hn-api');

// Stub for error response
const errorMessage = require('../response-stubs/error');

// This function parses news.ycombinator.com using simple strings
const parseStories = (stories) => {
    const fields = [];
    const ycURL = 'https://news.ycombinator.com/item?id=';

    for (let story of stories) {
        let readString = '<' + ( story.url ? story.url : ycURL + story.id ) + '|Read>';

        // Prepare fields array according to Slack attachment format
        fields.push({
            title: story.title + '  :small_red_triangle: ' + story.score,
            value: `${readString}   :speech_balloon:  <https://news.ycombinator.com/item?id=${story.id}|${story.descendants} comments>`,
            short: false
        });

    }
    return fields;
};

// This function gets 5 top stories from news.ycombinator.com and generates Slack attachment object
module.exports = (req, res, next) => {
    let value = myCache.get("hackernews");
    if (value === undefined) {
        const thumbUrl = 'http://www.ycombinator.com/images/ycombinator-logo-fb889e2e.png';
        hn.fetchTopStories(5).then((topStories) => {
            const fields = parseStories(topStories);

            // Make the Slack attachment - one object
            const result = {
                fallback: 'Hacker News daily digest.',
                color: '#36a64f',
                pretext: 'Top stories on Hacker News',
                title: 'Hacker News',
                title_link: 'https://news.ycombinator.com/',
                fields: fields,
                thumb_url: thumbUrl,
                mrkdwn_in: ['text', 'fields'],
                footer: 'Standuply',
                footer_icon: 'https://app.standuply.com/img/16.png',
                ts: Math.round(Date.now() / 1000)
            };

            myCache.set("hackernews", result);
            res.json(result);
        })
            .catch(error => {
                console.log('Hacker News error', error);
                res.json(errorMessage(error.toString()));
            });
    } else {
        res.json(value);
    }

};
