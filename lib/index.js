import restify from 'restify';
import request from 'request';
import cheerio from 'cheerio';

// setup server
const server = restify.createServer({
  name: 'Groot',
  version: '1.0.0',
});


server.use(restify.bodyParser());

server.post('/download', (req, res, next) => {

  const url = req.body.url;

  request(url, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const json = getJSON(body);
      const media = getMedia(json);

      res.send(media);
    } else {
      console.log(error);
    }
    next();
  });
});


// server listening on port 8080
server.listen(8080, () => console.log(`listening: ${server.url}`));




/**
 * @function getJSON
 *
 * @description parse JSON from html body
 * @param {String} html - HTML string
 * @return {Object}
 */
const getJSON = (html) => {
  const $ = cheerio.load(html);
  const $body = $('body');
  const $script = $body.find('script').eq(2).text();
  const jsonString = $script.slice(21, ($script.length - 1));
  return JSON.parse(jsonString);
}


/**
 * @function getMedia
 *
 * @description get video or image data from response object
 * @param {Object}
 * @return {Object}
 */
const getMedia = (obj) => {
  const post = obj.entry_data.PostPage[0];
  const media = post.graphql.shortcode_media;
  return parseMedia(media);
}


/**
 * @function getFileName
 *
 * @description Retrieve file name with extension from url
 * @param {String} url
 * @return {String}
 */
const getFileName = (url) => {
  const urlParts = url.split('/');
  const lastIndex = urlParts.length - 1;
  const fileName = urlParts[lastIndex]

  return fileName;
}


const parseMedia = (obj) => {

  // retrieve video url if video or image url
  const url = obj.video_url || obj.display_url;
  const type = obj.is_video ? 'video' : 'image';
  const name = getFileName(url);

  return {
    url,
    type,
    name,
  };
}