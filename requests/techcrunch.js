const myCache = require('../util/my.node.cache');

const parser = require('rss-url-parser');

// Stub for error response
const errorMessage = require('../response-stubs/error');

// This function parses techcrunch's JSON
const parseTechcrunchPosts = (data) => {
    let news = '';

    for (let i = 0; i < data.length; i++) {
        const post = data[i];

        news += post.title + '\n';
        news += `[Read](${post.link})` + '\n\n';

        if (i >= 5) {
            break;
        }
    }

    return news;
};

// This function gets json result from techcrunch
module.exports = (req, res, next) => {
    let value = myCache.get('techcrunch');

    if (value !== undefined) {
        res.json(value);
        return;
    }

    parser('https://techcrunch.com/category/startups/feed/')
        .then((data) => {
            const news = parseTechcrunchPosts(data);

            if (news === '') {
                throw 'parsing RSS JSON';
            }

            let blocks = [];

            if (req.url.includes('messengerType=slack')) {
                blocks = [
                    {
                        type: 'text',
                        text: 'Latest posts from Techcrunch',
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
                        text: '**Latest posts from Techcrunch**',
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

            myCache.set('techcrunch', result);
            res.json(result);
        })
        .catch(error => {
            console.log('Techcrunch error', error);

            res.json(errorMessage(error.toString()));
        });
};
