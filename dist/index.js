'use strict';

var _restify = require('restify');

var _restify2 = _interopRequireDefault(_restify);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _raven = require('raven');

var _raven2 = _interopRequireDefault(_raven);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_raven2.default.config('https://3d226af42eff4927a6d026a0d639194b:7e10049f8b3e4ea1938076cd705c00af@sentry.io/197200').install();
_raven2.default.disableConsoleAlerts();

var PORT = process.env.PORT || 8080;

var DEFAULT_HEADERS = {
  'Access-Control-Allow-Origin': '*'
};

// setup server
var server = _restify2.default.createServer({
  name: 'Groot',
  version: '1.0.0'
});

server.use(_raven2.default.requestHandler());

// use default accept parser
server.use(_restify2.default.CORS({
  'headers': ['Access-Control-Origin-Request-Method', 'Access-Control-Request-Headers', 'Access-Control-Allow-Origin']
}));

// Rate limit
// server.use(restify.throttle({
//   rate: 50,
//   ip: true,
// }));


server.use(_restify2.default.bodyParser());
server.use(_restify2.default.queryParser());

server.get('/fetch/file', function (req, res, next) {
  var url = req.query.url;
  handleRequest(url, req, res, next);
});

server.post('/fetch/file', function (req, res, next) {
  var url = req.body.url;
  console.log('Url', url);
  handleRequest(url, req, res, next);
});
/**
 *
 * Get request for downloading file
 */
server.get('/download', function (req, res, next) {
  var url = req.query.url;
  var type = req.query.type;
  var filename = req.query.filename;

  res.writeHead(200, {
    'Content-Type': type + '/*',
    'Content-Disposition': 'attachment; filename=' + filename
  });

  _request2.default.get(url).pipe(res);
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
  var $script = $body.find('script').eq(0).text();
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
  var thumbnail = obj.display_url;
  var type = obj.is_video ? 'video' : 'image';
  var name = getFileName(url);

  return {
    url: url,
    type: type,
    name: name,
    thumbnail: thumbnail
  };
};

var handleRequest = function handleRequest(url, req, res, next) {
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
};