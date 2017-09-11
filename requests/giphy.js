const requestPromise = require('request-promise');

// Stub for error response
const errorMessage = require('../response-stubs/error');

// This function parses giphy.com using simple strings
const parsePage = (data) => {
    const num = Math.floor(Math.random() * 10) + 1;

    let startIndex = 0;
    for (let i = 0; i < num; i++) {
        startIndex = data.indexOf('"fixed_height":', startIndex + 1);
    }

    let gifsIndex = startIndex;
    let gifsString = data.substring(data.indexOf('{', gifsIndex), data.indexOf('}', gifsIndex) + 1);
    let gifs = JSON.parse(gifsString);

    // check size to fit the Slack's 3MB limit
    if (gifs && gifs.size && gifs.size > 2500000) {
        gifsIndex = data.indexOf('"fixed_height_small":', startIndex + 1);
        gifsString = data.substring(data.indexOf('{', gifsIndex), data.indexOf('}', gifsIndex) + 1);
        gifs = JSON.parse(gifsString);

    }

    const stillIndex = data.indexOf('"fixed_height_small_still":', startIndex + 1);
    const stillString = data.substring(data.indexOf('{', stillIndex), data.indexOf('}', stillIndex) + 1);
    const still = JSON.parse(stillString);

    return {gifs, still};
};

// This function gets and parses giphy.com using simple strings
module.exports = (req, res, next) => {
    const request = {
        method: 'GET',
        uri: 'https://giphy.com/',
        json: false,
        simple: false
    };

    requestPromise(request)
        .then(data => {
            const parseResult = parsePage(data);

            // Make the Slack attachment - one object
            const result = {
                fallback: 'Giphy daily digest.',
                color: '#36a64f',
                pretext: 'A trending gif',
                title: 'Giphy',
                title_link: 'https://giphy.com/',
                image_url: parseResult.gifs.url,
                thumb_url: parseResult.still.url,
                footer: 'Standuply',
                footer_icon: 'https://app.standuply.com/img/16.png',
                ts: Math.round(Date.now() / 1000)
            };
            res.json(result);
        })
        .catch(error => {
            console.log('giphy error', error);
            res.json(errorMessage(error.toString()));
        });

};
