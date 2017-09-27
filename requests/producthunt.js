const requestPromise = require('request-promise');
const cheerio = require('cheerio');
const emoji = require('node-emoji');

// Stub for error response
const errorMessage = require('../response-stubs/error');

//This function parses producthunt.com using Cheerio.js
const parsePage = (data) => {
    const page = cheerio.load(data);
    const fullWidthBox = cheerio.load(page('*[class^="fullWidthBox_"]').html());
    const primContent = cheerio.load(fullWidthBox('*[class^="postsList_"]').html());

    const fields = [];
    let thumbUrl = 'https://s3.producthunt.com/static/ph-logo-2.png';

    primContent('li').each((i, elm) => {
        const itemContent = cheerio.load(primContent(elm).html(), {decodeEntities:false});
        const href = itemContent('*[class*="link_"]').attr('href');
        if (!thumbUrl) {
            const imgTag = cheerio.load(itemContent('*[class*="thumbnail_"]').find('noscript').html());
            thumbUrl = imgTag('img').attr('src');
        }

        const title = itemContent('*[class*="title_"]').html();
        const tagline = emoji.unemojify( itemContent('*[class*="tagline_"]').html() );
        const actions = itemContent('*[class*="actions_"]').text();
        const actionsArray = actions.split(/(\s+)/);

        let upvotes = '';
        let comments = '';
        if (actionsArray.length >= 3) {
            upvotes = actionsArray[actionsArray.length - 3];
            comments = actionsArray[actionsArray.length - 1];
        }

        // Prepare fields array according to Slack attachment format
        fields.push({
            title: title + '  :small_red_triangle: ' + upvotes + '  :speech_balloon: ' + comments,
            value: '<https://www.producthunt.com' + href + '|' + tagline + '>',
            short: false
        });

        if (i >= 4) return false;
    });

    return {fields, thumbUrl};
};

// This function gets producthunt.com and generates Slack attachment
module.exports = (req, res, next) => {
    const request = {
        method: 'GET',
        uri: 'https://www.producthunt.com/',
        encoding : 'utf8',
        json: false,
        simple: false
    };

    requestPromise(request)
        .then(data => {
            const parseResult = parsePage(data);

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
            res.json(result);
        })
        .catch(error => {
            console.log('Product Hunt error', error);
            res.json(errorMessage(error.toString()));
        });
};
