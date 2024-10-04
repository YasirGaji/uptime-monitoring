const http = require('http');
const url = require('url');

const server = http.createServer(function (req, res) {
  const parsedUrl = url.parse(req.url, true);

  const path = parsedUrl.pathname;

  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  // trims off url to get a clean path url

  res.end('Hello world\n');

  console.log('Request received on path: '+trimmedPath)
});

server.listen(3001, function () {
  console.log('The server is listening on port');
});
