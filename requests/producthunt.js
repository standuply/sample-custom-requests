const myCache = require('../util/my.node.cache');

const productHuntAPI = require('producthunt');

// Stub for error response
const errorMessage = require('../response-stubs/error');

//This function parses producthunt's API response
const processResponse = (data) => {
    let news = '';

    for (let i = 0; i < 5; i++) {
        const post = data.posts[i];

        news += post.name + '  🔺 ' + post.votes_count + '  💬 ' + post.comments_count + '\n';
        news += `[${post.tagline}](${post.discussion_url})` + '\n\n';
    }

    return news;
};

let responseWithError = function (error, res) {
    console.error('Product Hunt error' + JSON.parse(JSON.stringify(error)));

    res.json(errorMessage(error));
};

// This function gets last posts from producthunt.com and generates Slack attachment
module.exports = (req, res, next) => {
    let value = myCache.get('producthunt');

    if (value !== undefined) {
        res.json(value);

        return;
    }

    const productHunt = new productHuntAPI({
        client_id: process.env.PRODUCTHUNT_CLIENT_ID,
        client_secret: process.env.PRODUCTHUNT_CLIENT_SECRET,
        grant_type: 'client_credentials'
    });

    productHunt.posts.index({}, (error, postsResult) => {
        if (error) {
            responseWithError(error.toString(), res);

            return;
        }

        const resultJSON = postsResult.toJSON();

        if (resultJSON.statusCode < 300) {
            const bodyJSON = JSON.parse(resultJSON.body);

            const news = processResponse(bodyJSON);

            const blocks = [
                {
                    type: 'text',
                    text: 'Top products on Product Hunt',
                    markdown: false,
                },
                {
                    type: 'text',
                    text: news,
                    markdown: true,
                    color: 'green',
                }
            ];

            const result = { blocks };

            myCache.set('producthunt', result);
            res.json(result);
        } else {
            responseWithError('Bad status code received - ' + resultJSON.statusCode, res);
        }
    });
};
