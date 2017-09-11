const restify = require('restify');
const server = restify.createServer();

const producthuntRequest = require('./requests/producthunt');
const hackernewsRequest = require('./requests/hackernews');
const giphyRequest = require('./requests/giphy');


module.exports =  (options) => {
    server.get('/producthunt', producthuntRequest);

    server.get('/hackernews', hackernewsRequest);

    server.get('/giphy', giphyRequest);

    server.listen(options.port, options.host, () => {
        console.log('%s listening at %s', server.name, server.url);
    });
}

