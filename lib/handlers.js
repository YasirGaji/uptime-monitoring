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
  // Check that all required fields are filled out
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
    // Make sure the user doesnt already exist
    _data.read('users', phone, function (err, data) {
      if (err) {
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if (hashedPassword) {
          var userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            hashedPassword: hashedPassword,
            tosAgreement: true,
          };

          // Store the user
          _data.create('users', phone, userObject, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: 'Could not create the new user' });
            }
          });
        } else {
          callback(500, { Error: "Could not hash the user's password." });
        }
      } else {
        // User alread exists
        callback(400, {
          Error: 'A user with that phone number already exists',
        });
      }
    });
  } else {
    callback(400, {
      Error: 'Missing required fields',
      Info: data.payload.error,
    });
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
    _data.read('users', phone, function (err, data) {
      if (!err && data) {
        // removed hashed password from the user object before returning it
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users - Put
handlers._users.put = function (data, callback) {
  // Check for the required field
  const phone =
    typeof( data.payload.phone )== 'string' &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  // Check for the optional fields
  const firstName =
    typeof (data.payload.firstName )== 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof (data.payload.lastName) == 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  const password =
    typeof (data.payload.password) == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  // Error if the phone is invalid
  if(phone) {
    if(firstName || lastName || password){
      _data.read('users', phone, function(err, userData){
        if (!err && userData){
          if(firstName){
            userData.firstName = firstName;
          }
          if(lastName){
            userData.lastName = lastName;
          }
          if(password){
            userData.hashedPassword = helpers.hash(password);
          }
          // Store the new updates
          _data.update('users', phone, userData, function(err){
            if(!err){
              callback(200);
            } else {
              console.log(err)
              callback(500, {Error: 'Could not update the user'})
            }
          });
        } else {
          callback(400, {Error: 'The specified user does not exist'})
        }
      })
    } else {
      callback(400, {Error: 'Missing fields to update'})
    }
  } else {
    callback(400, {Error: 'Missing required field'})
  }
}

// Users - Delete
handlers._users.delete = function (data, callback) {
  // Validate phone number
  const phone =
    typeof data.queryStringObject.phone == 'string' &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    // confirm user
    _data.read('users', phone, function (err, data) {
      if (!err && data) {
        _data.delete('users', phone, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: 'Could not delete the specified user' });
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Tokens
handlers.tokens = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// tokens submethods container
handlers._tokens = {};


// Tokens - Post : requires phone and password no optional fields
handlers._tokens.post = function (data, callback) {
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


  if (phone && password) {
    _data.read ('users', phone, function(err, userData){
      if(!err && userData){
        // Hash the sent password and compare it to the password stored in the user object
        const hashedPassword = helpers.hash(password);
        if(hashedPassword == userData.hashedPassword){
          // if valid, create a new token with a random name. Set expiration date 1 hour into the future
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          
          const tokenObject = {
            phone: phone,
            id: tokenId,
            expires: expires
          }


          // Store the token
          _data.create('tokens', tokenId, tokenObject, function(err){
            if(!err){
              callback(200, tokenObject);
            } else {
              callback(500, {Error: 'Could not create the new token'})
            }
          })
        } else {
          callback(400, {Error: 'Password did not match the specified user\'s stored password'})
        }
      } else {
        callback(400, {Error: 'Could not find the specified user'})
      }
    })
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
}

// Tokens - get
handlers._tokens.get = function (data, callback) {
  // Validate phone number
  const id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
      
  if (id) {
    // confirm user
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
}

// Tokens - put
handlers._tokens.put = function (data, callback) {
  const id = typeof data.payload.id == 'string' &&
    data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  const extend = typeof data.payload.extend == 'boolean' && data.payload.extend == true

  if(id && extend){
    _data.read('tokens', id, function(err, tokenData){
      if(!err && tokenData){
        // Check if the token is not already expired
        if(tokenData.expires > Date.now()){
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the new updates
          _data.update('tokens', id, tokenData, function(err){
            
            if(!err){
              callback(200);
            } else {
              callback(500, {Error: 'Could not update the token\'s expiration'})
            }
          })
        } else {
          callback(400, {Error: 'The token has already expired and cannot be extended'})
        }
      } else {
        callback(400, {Error: 'Specified token does not exist'})
      }
    })
  } else {
    callback(400, {Error: 'Missing required fields or fields are invalid'})
  }
}

// Tokens - delete
handlers._tokens.delete = function (data, callback) {}


// Ping handler
handlers.hello = function (data, callback) {
  callback(200, { welcomeMessage: 'Hello world' });
};

// Incase handlers are not found
handlers.notFound = function (data, callback) {
  callback(404);
};

module.exports = handlers;
