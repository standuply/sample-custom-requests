const myCache = require('../util/my.node.cache');

// Require with the public beta key
const giphy = require('giphy-api')();

// Stub for error response
const errorMessage = require('../response-stubs/error');

// This function parses giphy.com using simple strings
const processGiphy = (data) => {
    let gifURL;
    const num = Math.floor(Math.random() * data.data.length);

    if (data.data[num].images.fixed_height.size > 2500000) {
        gifURL = data.data[num].images.fixed_height_small.url;
    } else {
        gifURL = data.data[num].images.fixed_height.url;
    }

    let stillURL = data.data[num].images.fixed_height_small_still.url;

    return {image: gifURL, thumbnail: stillURL};
};

// This function gets and parses giphy.com using simple strings
module.exports = (req, res, next) => {
    let value = myCache.get("giphy");
    if (value !== undefined) {
        res.json(value);
        return;
    }

    giphy.trending({
        limit: 10,
        fmt: 'json'
    })
        .then(data => {
            const parseResult = processGiphy(data);

            // Make the Slack attachment - one object
            const result = {
                fallback: 'Giphy daily digest.',
                color: '#36a64f',
                pretext: 'A trending gif',
                title: 'Giphy',
                title_link: 'https://giphy.com/',
                image_url: parseResult.image,
                thumb_url: parseResult.thumbnail,
                footer: 'Standuply',
                footer_icon: 'https://app.standuply.com/img/16.png',
                ts: Math.round(Date.now() / 1000)
            };

            myCache.set("giphy", result);
            res.json(result);
        })
        .catch(error => {
            console.log('giphy error', error);
            res.json(errorMessage(error.toString()));
        });

};
