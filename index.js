const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');

//Server requests

const server = http.createServer(function (req, res) {
  const parsedUrl = url.parse(req.url, true);

  const path = parsedUrl.pathname;

  // trims off url to get a clean path url
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  const queryStringObject = parsedUrl.query;

  // functions to get http methods
  const method = req.method.toLowerCase();

  // this would get headers as an object
  const headers = req.headers;

  // function to get payload
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', function (data) {
    buffer += decoder.write(data);
  });
  req.on('end', function () {
    buffer += decoder.end();

    //choosing handler for the request
    const chosenHandler =
      typeof router[trimmedPath] !== 'undefined'
        ? router[trimmedPath]
        : handlers.notFound;

    //construct data object to send to the handler

    const data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: buffer,
    };

    // calling data by routing the request to the specified handler in the router
    chosenHandler(data, function (statusCode, payload) {
      // the default status code is 200 in absence of the called back status code by the handler
      statusCode = typeof statusCode == 'number' ? statusCode : 200;
      // default to an empty object in absence of the payload called by the handler
      payload = typeof payload == 'object' ? payload : {};

      // Objects cannot be sent back to user so in turn we'd convert the payload to a string

      const payloadString = JSON.stringify(payload);

      // finally return the response
      res.setHeader('Content-Type', 'application/json'); // formatting data to JSON
      res.writeHead(statusCode);
      res.end(payloadString);

      // logging the request path
      console.log(
        'Request received and returning this response: ',
        statusCode,
        payload
      );
    });
  });
});

//starting server 
server.listen(config.port, function () {
  console.log('The server is listening on port ' +config.port +' in ' +config.envName+ ' mode.');
});

// defining handlers
const handlers = {};

// sample handler
handlers.sample = function (data, callback) {
  //callback http status code and a payload object
  callback(406, { name: 'sample handler' });
};

// Incase handlers are not found
handlers.notFound = function (data, callback) {
  callback(404);
};

// Defining a router request
const router = {
  sample: handlers.sample,
};
