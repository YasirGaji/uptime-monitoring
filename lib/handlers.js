// Request Handlers

const _data = require('./data');
const helpers = require('./helpers');

// defining handlers
const handlers = {};

// Users
handlers.users = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// users submethods container
handlers._users = {};

// Users - Post
handlers._users.post = function (data, callback) {
  // confirm all required fields are filled out
  const firstName =
    typeof data.payload.firstName == 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName == 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const phone =
    typeof data.payload.phone == 'string' &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  const password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  const tosAgreement =
    typeof data.payload.tosAgreement == 'boolean' &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Confirm if the user exist
    _data.read('users', phone, function (err, data) {
      if (err) {
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          const userObject = {
            firstName: firstName,
            lastName: lastName, 
            phone: phone,
            hashedPassword: hashedPassword,
            tosAgreement: true,
          };

          // Stores the user
          _data.create('users', phone, userObject, function (err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: 'Could not create user' });
            }
          });
        } else {
          callback(500, { Error: "Could not hash the user's password" });
        }
      } else {
        callback(400, { Error: 'A user with this phone number already exist' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields ' });
  }
};

// Users - Get
handlers._users.get = function (data, callback) {
  // Validate phone number
  const phone =
    typeof data.queryStringObject.phone == 'string' &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
    if (phone) {
      // confirm user 
      _data.read('users', phone, function(err, data){
        if(!err && data) {
          // removed hashed password from the user object before returning it
          delete data.hashedPassword;
          callback(200, data``)
        } else {
          callback(404)
        }
      })
    } else {
      callback(400, { 'Error' : 'Missing required field' })
    }
};

// Users - Put
handlers._users.put = function (data, callback) {};

// Users - Delete
handlers._users.delete = function (data, callback) {};

// Ping handler
handlers.hello = function (data, callback) {
  callback(200, { welcomeMessage: 'Hello world' });
};

// Incase handlers are not found
handlers.notFound = function (data, callback) {
  callback(404);
};

module.exports = handlers;
