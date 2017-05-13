import restify from 'restify';


// setup server
const server = restify.createServer({
  name: 'Groot',
  version: '1.0.0',
});


server.post('/download', (req, res, next) => {
  res.end('We\'re here');
  next();
});


// server listening on port 8080
server.listen(8080, () => console.log(`listening: ${server.url}`));
