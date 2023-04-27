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

                    if (smallUrl !== null) {
                        url = smallUrl;
                    }
                } else {
                    let smallUrl = getUrlFromArray(images[0].resolutions, 300);

                    if (smallUrl !== null) {
                        url = smallUrl;
                    }
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

    if (subreddit === 'subreddit_name')
        subreddit = 'aww';

    let value = myCache.get('reddit-image-' + subreddit);

    if (value !== undefined) {
        res.json(value);
        return;
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

            let blocks = [];

            if (req.url.includes('messengerType=slack')) {
                blocks = [
                    {
                        type: 'text',
                        text: `Top image from Reddit / ${subreddit}`,
                        markdown: false,
                    },
                    {
                        type: 'text',
                        text: parseResult.title + '\n' + `[💬    ${parseResult.comments} comments](https://www.reddit.com${parseResult.permalink})`,
                        markdown: true,
                        color: 'green',
                    },
                    {
                        type: 'image',
                        url: parseResult.image,
                        title: '',
                        altText: 'A Reddit image',
                        color: 'green',
                    }
                ];
            }

            if (req.url.includes('messengerType=microsoft-teams')) {
                blocks = [
                    {
                        type: 'text',
                        text: `**Top image from Reddit / ${subreddit}**`,
                        markdown: false,
                    },
                    {
                        type: 'text',
                        text: parseResult.title + '\n' + `[💬    ${parseResult.comments} comments](https://www.reddit.com${parseResult.permalink})`,
                        markdown: true,
                    },
                    {
                        type: 'image',
                        url: parseResult.image,
                        title: '',
                        altText: 'A Reddit image',
                    }
                ];
            }

            const result = { blocks };

            myCache.set('reddit-image-' + subreddit, result);
            res.json(result);
        })
        .catch(error => {
            console.log('Reddit error', error);

            res.json(errorMessage(error.toString()));
        });

};
