const requestPromise = require('request-promise');

// Stub for error response
const errorMessage = require('../response-stubs/error');

// This function parses news.ycombinator.com using simple strings
const parsePage = (data) => {
    const fields = [];

    let rankIndex = data.indexOf('class="rank">1');

    for (let i = 0; i < 5; i++) {
        const urlIndex = data.indexOf('class="title"><a href="', rankIndex);
        const urlString = data.substring(urlIndex + 23, data.indexOf('"', urlIndex + 23));

        const titleIndex = data.indexOf('class="storylink">', urlIndex);
        const titleString = data.substring(titleIndex + 18, data.indexOf('</a>', titleIndex));

        let scoreIndex = data.indexOf('class="score"', titleIndex);
        scoreIndex = data.indexOf('>', scoreIndex);
        const scoreString = data.substring(scoreIndex + 1, data.indexOf(' ', scoreIndex));

        const commentsIndex = data.indexOf('&nbsp;comments', scoreIndex);
        const commentsStartIndex = data.lastIndexOf('>', commentsIndex);
        const commentsString = data.substring(commentsStartIndex + 1, commentsIndex);

        const commentsUrlIndex = data.lastIndexOf('href="', commentsIndex);
        const commentsUrlString = data.substring(commentsUrlIndex + 6, data.lastIndexOf('"', commentsStartIndex));

        // Prepare fields array according to Slack attachment format
        fields.push({
            title: titleString.replace('’', '\'') + '  :small_red_triangle: ' + scoreString,
            value: '<' + urlString + '|Read>' + '     :speech_balloon: ' + '<https://news.ycombinator.com/' + commentsUrlString + '|' + commentsString + ' comments>',
            short: false
        });

        rankIndex = data.indexOf('class="rank">', commentsIndex);
    }
    return fields;
};

// This function gets news.ycombinator.com and generates Slack attachment object
module.exports = (req, res, next) => {
    const request = {
        method: 'GET',
        uri: 'https://news.ycombinator.com/',
        json: false,
        simple: false
    };

    const thumbUrl = 'http://www.ycombinator.com/images/ycombinator-logo-fb889e2e.png';

    requestPromise(request)
        .then(data => {
            const fields = parsePage(data);

            // Make the Slack attachment - one object
            const result = {
                fallback: 'Hacker News daily digest.',
                color: '#36a64f',
                pretext: 'Top stories on Hacker News',
                title: 'Hacker News',
                title_link: 'https://news.ycombinator.com/',
                fields: fields,
                thumb_url: thumbUrl,
                mrkdwn_in: ['text', 'fields'],
                footer: 'Standuply',
                footer_icon: 'https://app.standuply.com/img/16.png',
                ts: Math.round(Date.now() / 1000)
            };
            res.json(result);
        })
        .catch(error => {
            console.log('Hacker News error', error);
            res.json(errorMessage(error.toString()));
        });

};
