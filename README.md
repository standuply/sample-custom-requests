Standuply custom request examples
=================================

Here is the set of samples for [Standuply](https://standuply.com) custom request feature.

Standuply expects response from your endpoint in the format of Slack attachment. It should be one attachment object in every response.

Please, check the Slack [Attachment formatting](https://api.slack.com/docs/message-attachments).

Try your attachments in the [Message Builder](https://api.slack.com/docs/messages/builder?msg=%7B%22attachments%22%3A%5B%7B%22fallback%22%3A%22Giphy%20daily%20digest.%22%2C%22color%22%3A%22%2336a64f%22%2C%22pretext%22%3A%22A%20trending%20gif%22%2C%22title%22%3A%22Giphy%22%2C%22title_link%22%3A%22https%3A%2F%2Fgiphy.com%2F%22%2C%22image_url%22%3A%22https%3A%2F%2Fmedia3.giphy.com%2Fmedia%2FS3Ot3hZ5bcy8o%2Fgiphy.gif%22%2C%22thumb_url%22%3A%22https%3A%2F%2Fmedia3.giphy.com%2Fmedia%2FS3Ot3hZ5bcy8o%2F100_s.gif%22%2C%22footer%22%3A%22Standuply%22%2C%22footer_icon%22%3A%22https%3A%2F%2Fapp.standuply.com%2Fimg%2F16.png%22%2C%22ts%22%3A1504835585.527%7D%5D%7D).

There are 4 examples presented:
* /producthunt
* /hackernews
* /giphy
* /reddit and /reddit/_subreddit_name_

Try it now
----------
The Node JS environment has to be installed to run the samples.

Clone this repo. Copy file .env/env.tpl to .env/env and set your values.
Please find Client ID and Secret for Product Hunt in the [app dashboard](https://www.producthunt.com/v1/oauth/applications)

Then run
```npm i```
and
```npm start```
in repo's folder.

By default, the server listens on port 8080, e.g. http://localhost:8080/giphy

