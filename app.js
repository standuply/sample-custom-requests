require('dotenv').config({path: './.env/env'});

const restify = require('restify');
const server = restify.createServer();

const producthuntRequest = require('./requests/producthunt');
const hackernewsRequest = require('./requests/hackernews');
const giphyRequest = require('./requests/giphy');
const redditImageRequest = require('./requests/reddit-image');
const redditPostsRequest = require('./requests/reddit-posts');

const techcrunchRequest = require('./requests/techcrunch');
const mediumRequest = require('./requests/medium');

module.exports =  (options) => {
    server.get('/producthunt', producthuntRequest);

    server.get('/hackernews', hackernewsRequest);

    server.get('/giphy', giphyRequest);

    server.get('/reddit-image', redditImageRequest);
    server.get('/reddit-image/:subreddit', redditImageRequest);

    server.get('/reddit-posts', redditPostsRequest);
    server.get('/reddit-posts/:subreddit', redditPostsRequest);

    server.get('/techcrunch', techcrunchRequest);

    server.get('/medium', mediumRequest);

    server.listen(options.port, options.host, () => {
        console.log('%s listening at %s', server.name, server.url);
    });
};

