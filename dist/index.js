'use strict';

var _restify = require('restify');

var _restify2 = _interopRequireDefault(_restify);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PORT = process.env.PORT || 8080;

// setup server
var server = _restify2.default.createServer({
  name: 'Groot',
  version: '1.0.0'
});

server.use(_restify2.default.bodyParser());

server.post('/download', function (req, res, next) {

  var url = req.body.url;

  (0, _request2.default)(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var json = getJSON(body);
      var media = getMedia(json);

      res.send(media);
    } else {
      console.log(error);
    }
    next();
  });
});

// server listening on port 8080
server.listen(PORT, function () {
  return console.log('listening: ' + server.url);
});

/**
 * @function getJSON
 *
 * @description parse JSON from html body
 * @param {String} html - HTML string
 * @return {Object}
 */
var getJSON = function getJSON(html) {
  var $ = _cheerio2.default.load(html);
  var $body = $('body');
  var $script = $body.find('script').eq(2).text();
  var jsonString = $script.slice(21, $script.length - 1);
  return JSON.parse(jsonString);
};

/**
 * @function getMedia
 *
 * @description get video or image data from response object
 * @param {Object}
 * @return {Object}
 */
var getMedia = function getMedia(obj) {
  var post = obj.entry_data.PostPage[0];
  var media = post.graphql.shortcode_media;
  return parseMedia(media);
};

/**
 * @function getFileName
 *
 * @description Retrieve file name with extension from url
 * @param {String} url
 * @return {String}
 */
var getFileName = function getFileName(url) {
  var urlParts = url.split('/');
  var lastIndex = urlParts.length - 1;
  var fileName = urlParts[lastIndex];

  return fileName;
};

var parseMedia = function parseMedia(obj) {

  // retrieve video url if video or image url
  var url = obj.video_url || obj.display_url;
  var type = obj.is_video ? 'video' : 'image';
  var name = getFileName(url);

  return {
    url: url,
    type: type,
    name: name
  };
};