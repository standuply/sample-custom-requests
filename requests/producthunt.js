const myCache = require('../util/my.node.cache');

const productHuntAPI = require('producthunt');

// Stub for error response
const errorMessage = require('../response-stubs/error');

//This function parses producthunt's API response
const processResponse = (data) => {
    const fields = [];
    let thumbUrl = 'https://s3.producthunt.com/static/ph-logo-2.png';

    for (let i = 0; i < 5; i++) {
        const post = data.posts[i];

        // Prepare fields array according to Slack attachment format
        fields.push({
            title: post.name + '  :small_red_triangle: ' + post.votes_count + '  :speech_balloon: ' + post.comments_count,
            value: `<${post.discussion_url}|${post.tagline}>`,
            short: false
        });
    }

    return {fields, thumbUrl};
};

let responseWithError = function (error, res) {
    console.log('Product Hunt error', error);
    res.json(errorMessage(error));
};

// This function gets last posts from producthunt.com and generates Slack attachment
module.exports = (req, res, next) => {
    let value = myCache.get("producthunt");
    if (value === undefined) {

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

                const parseResult = processResponse(bodyJSON);

                // Make the Slack attachment - one object
                const result = {
                    fallback: 'Product Hunt daily digest.',
                    color: '#36a64f',
                    pretext: 'Top products on Product Hunt',
                    title: 'Product Hunt popular',
                    title_link: 'https://www.producthunt.com/',
                    fields: parseResult.fields,
                    thumb_url: parseResult.thumbUrl,
                    mrkdwn_in: ['text', 'fields'],
                    footer: 'Standuply',
                    footer_icon: 'https://app.standuply.com/img/16.png',
                    ts: Math.round(Date.now() / 1000)
                };

                myCache.set("producthunt", result);
                res.json(result);
            } else {
                responseWithError('Bad status code received - ' + resultJSON.statusCode, res);
            }

        });
    } else {
        res.json(value);
    }

};
