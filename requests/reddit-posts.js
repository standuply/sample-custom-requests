const myCache = require('../util/my.node.cache');

const requestPromise = require('request-promise');

const humanReadable = require('../util/human-readable-number');

// Stub for error response
const errorMessage = require('../response-stubs/error');

// This function parses reddit's JSON
const parseRedditPosts = (data) => {

    if (data.kind === 'Listing' &&
        data.data.children.length > 0) {

        const fields = [];

        for (let item of data.data.children) {
            let post = item.data;
            let readString = '<' + post.url + '|Read>';

            // Prepare fields array according to Slack attachment format
            fields.push({
                title: post.title + '  :small_red_triangle: ' + humanReadable(post.score),
                value: `${readString}   :speech_balloon:  <https://www.reddit.com${post.permalink}|${post.num_comments} comments>`,
                short: false
            });

        }
        return fields;

    }

    return null;
};

// This function gets json result from reddit
module.exports = (req, res, next) => {
    let subreddit = req.params.subreddit ? req.params.subreddit : 'technology';
    if (subreddit === 'subreddit_name')
        subreddit = 'technology';

    let value = myCache.get('reddit-posts-' + subreddit);
    if (value !== undefined) {
        res.json(value);
        return;
    }

    let uri = 'https://www.reddit.com/r/' + subreddit;

    const request = {
        method: 'GET',
        uri: uri + '/top.json?t=day&limit=5',
        json: false,
        simple: false
    };

    requestPromise(request)
        .then(data => {
            const fields = parseRedditPosts(JSON.parse(data));
            if (fields === null) {
                throw 'parsing posts JSON, subreddit - ' + subreddit;
            }

            // Make the Slack attachment - one object
            const result = {
                fallback: 'Reddit top posts.',
                color: '#36a64f',
                pretext: 'Top posts from Reddit / ' + subreddit,
                title: subreddit + ' - Reddit',
                title_link: uri,
                fields: fields,
                mrkdwn_in: ['text', 'fields'],
                footer: 'Standuply',
                footer_icon: 'https://app.standuply.com/img/16.png',
                ts: Math.round(Date.now() / 1000)
            };


            myCache.set('reddit-posts-' + subreddit, result);
            res.json(result);
        })
        .catch(error => {
            console.log('Reddit error', error);
            res.json(errorMessage(error.toString()));
        });

};
