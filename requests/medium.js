const myCache = require('../util/my.node.cache');
const requestPromise = require('request-promise');
// Stub for error response
const errorMessage = require('../response-stubs/error');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

function findPosts(htmlString) {
    const postLinksNamesAndReadingTime = [];
    const dom = new JSDOM(htmlString);
    const { document } = dom.window;

    const postElements = document.querySelectorAll('.pw-trending-post');

    postElements.forEach((post) => {
        const linkElement = post.querySelector('a[href][rel="noopener follow"]:not([href^="/@"])');
        const nameElement = post.querySelector('h2');
        const readingTimeElement = post.querySelector('.pw-reading-time');

        if (linkElement && nameElement && readingTimeElement) {
            const href = linkElement.getAttribute('href');
            const name = nameElement.textContent;
            const readingTime = readingTimeElement.textContent;

            if (
                href.startsWith('https')
                && !postLinksNamesAndReadingTime.some(item => item.link === href)
            ) {
                postLinksNamesAndReadingTime.push({ name, link: href, readingTime });
            }
        }
    });

    return postLinksNamesAndReadingTime;
}

//This function parses medium's API response
const processResponse = (rawData) => {
    const posts = findPosts(rawData);
    const news = [];

    posts.map(post => {
        news.push(`[${post.name}](${post.link}) - ${post.readingTime}`);
    });

    return news;
};

// This function gets last posts from medium.com and generates Slack attachment
module.exports = (req, res, next) => {
    let value = myCache.get('medium');

    if (value !== undefined) {
        res.json(value);
        return;
    }

    let uri = 'https://medium.com';

    const request = {
        method: 'GET',
        uri: uri,
        json: false,
        simple: false
    };

    requestPromise(request)
        .then(data => {
            const news = processResponse(data);

            if (news === '') {
                throw 'parsing Medium';
            }

            let blocks = [];

            if (req.url.includes('messengerType=slack')) {
                blocks = [
                    {
                        type: 'text',
                        text: 'Most popular today from Medium',
                        markdown: false,
                    },
                ];

                let composedNews = '';

                for (const n of news) {
                    composedNews += n + '\n\n'
                }

                blocks.push({
                    type: 'text',
                    text: composedNews,
                    markdown: true,
                    color: 'green',
                })
            }

            if (req.url.includes('messengerType=microsoft-teams')) {
                blocks = [
                    {
                        type: 'text',
                        text: '**Most popular today from Medium**',
                        markdown: false,
                    },
                ];

                for (const n of news) {
                    blocks.push({
                        type: 'text',
                        text: n,
                        markdown: true,
                    })
                }
            }

            const result = { blocks };

            myCache.set('medium', result);
            res.json(result);
        })
        .catch(error => {
            console.log('Medium error', error);
            res.json(errorMessage(error.toString()));
        });
};
