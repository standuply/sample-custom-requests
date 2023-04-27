const myCache = require('../util/my.node.cache');

const hn = require('node-hn-api');

// Stub for error response
const errorMessage = require('../response-stubs/error');

// This function processes news.ycombinator.com JSON response
const parseStories = (stories) => {
    const ycURL = 'https://news.ycombinator.com/item?id=';

    let news = '';

    for (let story of stories) {
        let readString = `[Read](${story.url ? story.url : ycURL + story.id})`;

        news += story.title + '  🔺 ' + story.score + '\n';
        news += `${readString}   💬  [${story.descendants} comments](https://news.ycombinator.com/item?id=${story.id})` + '\n\n';
    }

    return news;
};

// This function gets 5 top stories from news.ycombinator.com and generates Slack attachment object
module.exports = (req, res, next) => {
    let value = myCache.get('hackernews');

    if (value !== undefined) {
        res.json(value);
        return;
    }

    hn.fetchTopStories(5)
        .then((topStories) => {
            const news = parseStories(topStories);

            let blocks = [];

            if (req.url.includes('messengerType=slack')) {
                blocks = [
                    {
                        type: 'text',
                        text: 'Top stories on Hacker News',
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
                        text: '**Top stories on Hacker News**',
                        markdown: false,
                    },
                    {
                        type: 'text',
                        text: news,
                        markdown: true,
                    }
                ];
            }

            // Make the Slack attachment - one object
            const result = { blocks };

            myCache.set('hackernews', result);
            res.json(result);
        })
        .catch(error => {
            console.log('Hacker News error', error);
            res.json(errorMessage(error.toString()));
        });
};
