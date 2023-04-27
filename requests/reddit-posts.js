const myCache = require('../util/my.node.cache');

const requestPromise = require('request-promise');

const humanReadable = require('../util/human-readable-number');

// Stub for error response
const errorMessage = require('../response-stubs/error');

// This function parses reddit's JSON
const parseRedditPosts = (data) => {
    if (
        data.kind === 'Listing' &&
        data.data.children.length > 0
    ) {
        let news = '';

        for (let item of data.data.children) {
            let post = item.data;
            let readString = `[Read](${post.url})`;

            news += post.title + '  🔺 ' + humanReadable(post.score) + '\n';
            news += `${readString}   💬  [${post.num_comments} comments](https://www.reddit.com${post.permalink})` + '\n\n';
        }

        return news;
    }

    return null;
};

// This function gets json result from reddit
module.exports = (req, res, next) => {
    let subreddit = req.params.subreddit ? req.params.subreddit : 'technology';

    if (subreddit === 'subreddit_name') {
        subreddit = 'technology';
    }

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
            const news = parseRedditPosts(JSON.parse(data));

            if (news === null) {
                throw 'parsing posts JSON, subreddit - ' + subreddit;
            }

            let blocks = [];

            if (req.url.includes('messengerType=slack')) {
                blocks = [
                    {
                        type: 'text',
                        text: 'Top posts from Reddit / ' + subreddit,
                        markdown: false,
                    },
                    {
                        type: 'text',
                        text: news,
                        markdown: true,
                        color: 'green',
                    }
                ];
            }

            if (req.url.includes('messengerType=microsoft-teams')) {
                blocks = [
                    {
                        type: 'text',
                        text: '**Top posts from Reddit / ' + subreddit + '**',
                        markdown: false,
                    },
                    {
                        type: 'text',
                        text: news,
                        markdown: true,
                    }
                ];
            }

            const result = { blocks };

            myCache.set('reddit-posts-' + subreddit, result);
            res.json(result);
        })
        .catch(error => {
            console.log('Reddit error', error);

            res.json(errorMessage(error.toString()));
        });
};
