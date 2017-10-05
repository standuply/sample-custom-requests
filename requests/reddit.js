const myCache = require('../util/my.node.cache');

const requestPromise = require('request-promise');

// Stub for error response
const errorMessage = require('../response-stubs/error');

// Choose image which width is smaller then provided
const getUrlFromArray = (resolutions, width) => {
    for (let i = 0; i < resolutions.length; i++) {
        if (resolutions[i].width > width) {
            return resolutions[i].url.replace(/\&amp;/g, '&');
        }
    }

    if (resolutions.length > 0) {
        return resolutions[0].url.replace(/\&amp;/g, '&');
    }

    return null;
};

// This function parses reddit's JSON
const parseReddit = (data) => {

    if (data.kind === 'Listing' &&
        data.data.children.length > 0) {

        let count = 10;
        while (count > 0) {
            count--;
            const num = Math.floor(Math.random() * data.data.children.length);
            const post = data.data.children[num].data;

            // ignore video posts
            if (post && post.preview && post.preview.images && post.preview.images.length > 0) {
                const images = post.preview.images;
                let url = post.url;

                // try to find a small gif or still image
                if (images[0].variants && images[0].variants.gif &&
                    images[0].variants.gif.resolutions.length > 0) {

                    let smallUrl = getUrlFromArray(images[0].variants.gif.resolutions, 150);
                    if (smallUrl !== null)
                        url = smallUrl;
                } else {
                    let smallUrl = getUrlFromArray(images[0].resolutions, 300);
                    if (smallUrl !== null)
                        url = smallUrl;
                }

                return {
                    image: url,
                    thumbnail: post.thumbnail,
                    permalink: post.permalink,
                    title: post.title,
                    comments: post.num_comments
                };
            }
        }
    }

    return null;
};

// This function gets json result from reddit
module.exports = (req, res, next) => {
    let subreddit = req.params.subreddit ? req.params.subreddit : 'aww';

    let value = myCache.get("reddit-" + subreddit);
    if (value !== undefined) {
        res.json(value);
    }

    let uri = 'https://www.reddit.com/r/' + subreddit;

    const request = {
        method: 'GET',
        uri: uri + '/top.json?t=day&limit=10',
        json: false,
        simple: false
    };

    requestPromise(request)
        .then(data => {
            const parseResult = parseReddit(JSON.parse(data));
            if (parseResult === null) {
                throw 'parsing JSON, subreddit - ' + subreddit;
            }

            // Make the Slack attachment - one object
            const result = {
                fallback: 'Reddit daily image.',
                color: '#36a64f',
                pretext: 'A Reddit image',
                title: subreddit + ' - Reddit',
                title_link: uri,
                fields: [
                    {
                        title: parseResult.title,
                        value: `<https://www.reddit.com${parseResult.permalink}|  :speech_balloon:    ${parseResult.comments} comments>`,
                        short: false
                    }
                ],
                mrkdwn_in: ['text', 'fields'],
                image_url: parseResult.image,
                thumb_url: parseResult.thumbnail,
                footer: 'Standuply',
                footer_icon: 'https://app.standuply.com/img/16.png',
                ts: Math.round(Date.now() / 1000)
            };

            myCache.set("reddit-" + subreddit, result);
            res.json(result);
        })
        .catch(error => {
            console.log('Reddit error', error);
            res.json(errorMessage(error.toString()));
        });

};
