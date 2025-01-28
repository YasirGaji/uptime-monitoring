const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');
const _data = require('./lib/data');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers')


// Tests to create, read, and update data @TODO delete these
// _data.create('test', 'newfile', {'Hello' : 'world'}, function(err){
//   console.log('Error: ', err)
// })

// _data.update('test', 'newfile', {'Hi' : 'universe'}, function(err){
//   console.log('Error: ', err)
// })

// _data.read('test', 'newfile', function(err, data){
//   console.log('Error: ', err, 'Data: ', data)
// })

// _data.delete('test', 'newfile', function(err){
//   console.log('Error: ', err)
// })




// Instantiating http server
const httpServer = http.createServer(function (req, res) {
  unifiedServer(req, res);
});

// starts http server
httpServer.listen(config.httpPort, function () {
  console.log(
    'The server is listening on port ' +
      config.httpPort
  );
});

// instantiate https server
const httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pm'),
  'cert' : fs.readFileSync('./https/cert.pem')
}

const httpsServer = https.createServer(httpsServerOptions, function (req, res) {
  unifiedServer(req, res);
});

// starts https server
httpsServer.listen(config.httpsPort, function () {
  console.log(
    'The server is listening on port ' +
      config.httpsPort
  );
});

// unified server for both http and https
const unifiedServer = function (req, res) {
  const parsedUrl = url.parse(req.url, true);

  const path = parsedUrl.pathname;

  // trims off url to get a clean path url using regex
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
      payload: helpers.parseJsonToObject(buffer),
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
};




// Defining a router request
const router = {
  'hello': handlers.hello,
  'users' : handlers.users
};
