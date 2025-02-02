// Request Handlers

const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

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

  // fetch the token from the headers
  const token =
    typeof data.headers.token == 'string' ? data.headers.token : false;

  // verify that the given token is valid for the phone number
  handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
    if (tokenIsValid) {
      if (phone) {
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
          callback(403, {
            Error: 'Missing required token in header, or token is invalid',
          });
        }
      } else {
        callback(400, { Error: 'Missing required field' });
      }
    }
  });
};

// Users - Put
handlers._users.put = function (data, callback) {
  // Check for the required field
  const phone =
    typeof data.payload.phone == 'string' &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  // Check for the optional fields
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
  const password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  // Error if the phone is invalid
  if (phone) {
    if (firstName || lastName || password) {
      // fetch the token from the headers
      const token =
        typeof data.headers.token == 'string' ? data.headers.token : false;

      // verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
        if (tokenIsValid) {
          _data.read('users', phone, function (err, userData) {
            if (!err && userData) {
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              // Store the new updates
              _data.update('users', phone, userData, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, { Error: 'Could not update the user' });
                }
              });
            } else {
              callback(400, { Error: 'The specified user does not exist' });
            }
          });
        } else {
          callback(403, {
            Error: 'Missing required token in header, or token is invalid',
          });
        }
      });
    } else {
      callback(400, { Error: 'Missing fields to update' });
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users - Delete
handlers._users.delete = function (data, callback) {
  // Validate phone number
  const phone =
    typeof data.queryStringObject.phone == 'string' &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    // fetch the token from the headers
    const token =
      typeof data.headers.token == 'string' ? data.headers.token : false;

    // verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        // confirm user
        _data.read('users', phone, function (err, data) {
          if (!err && data) {
            _data.delete('users', phone, function (err) {
              if (!err) {
                // Delete each of the checks associated with the user
                const userChecks =
                  typeof data.checks == 'object' && data.checks instanceof Array
                    ? data.checks
                    : [];

                const checksToDelete = userChecks.length;

                if (checksToDelete > 0) {
                  let checksDeleted = 0;
                  let deletionErrors = false;

                  // Loop through the checks

                  userChecks.forEach(function (checkId) {

                    // Delete the check

                    _data.delete('checks', checkId, function (err) {
                      if (err) {
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      
                      if (checksDeleted == checksToDelete) {
                        if (!deletionErrors) {
                          callback(200);
                        } else {
                          callback(500, {
                            Error:
                              'Errors encountered while attempting to delete all of the user checks. All checks may not have been deleted from the system successfully',
                          });
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, { Error: 'Could not delete the specified user' });
              }
            });
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {
          Error: 'Missing required token in header, or token is invalid',
        });
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
    _data.read('users', phone, function (err, userData) {
      if (!err && userData) {
        // Hash the sent password and compare it to the password stored in the user object
        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // if valid, create a new token with a random name. Set expiration date 1 hour into the future
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;

          const tokenObject = {
            phone: phone,
            id: tokenId,
            expires: expires,
          };

          // Store the token
          _data.create('tokens', tokenId, tokenObject, function (err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: 'Could not create the new token' });
            }
          });
        } else {
          callback(400, {
            Error:
              "Password did not match the specified user's stored password",
          });
        }
      } else {
        callback(400, { Error: 'Could not find the specified user' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

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
};

// Tokens - put
handlers._tokens.put = function (data, callback) {
  const id =
    typeof data.payload.id == 'string' && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  const extend =
    typeof data.payload.extend == 'boolean' && data.payload.extend == true;

  if (id && extend) {
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        // Check if the token is not already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the new updates
          _data.update('tokens', id, tokenData, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                Error: "Could not update the token's expiration",
              });
            }
          });
        } else {
          callback(400, {
            Error: 'The token has already expired and cannot be extended',
          });
        }
      } else {
        callback(400, { Error: 'Specified token does not exist' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields or fields are invalid' });
  }
};

// Tokens - delete
handlers._tokens.delete = function (data, callback) {
  // Validate id
  const id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // confirm user
    _data.read('tokens', id, function (err, data) {
      if (!err && data) {
        _data.delete('tokens', id, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: 'Could not delete the specified token' });
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

// verify if an ID is that of an authenticated user
handlers._tokens.verifyToken = function (id, phone, callback) {
  // Lookup the token
  _data.read('tokens', id, function (err, tokenData) {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Checks
handlers.checks = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

// checks submethods container
handlers._checks = {};

// Checks - Post
handlers._checks.post = function (data, callback) {
  // Validate inputs
  const protocol =
    typeof data.payload.protocol == 'string' &&
    ['http', 'https'].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;

  const url =
    typeof data.payload.url == 'string' && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  const method =
    typeof data.payload.method == 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;

  const successCodes =
    typeof data.payload.successCodes == 'object' &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == 'number' &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // check if user has provided a token from the headers
    const token =
      typeof data.headers.token == 'string' ? data.headers.token : false;

    // Lookup the user by reading the token
    _data.read('tokens', token, function (err, tokenData) {
      if (!err && tokenData) {
        const userPhone = tokenData.phone;

        // Lookup the user data
        _data.read('users', userPhone, function (err, userData) {
          if (!err && userData) {
            const userChecks =
              typeof userData.checks == 'object' &&
              userData.checks instanceof Array
                ? userData.checks
                : [];

            // Verify that the user has less than the number of max-checks-per-user

            if (userChecks.length < config.maxChecks) {
              // Create a random ID for the check
              const checkId = helpers.createRandomString(20);

              // Create the check object and include the user's phone
              const checkObject = {
                id: checkId,
                userPhone: userPhone,
                protocol: protocol,
                url: url,
                method: method,
                successCodes: successCodes,
                timeoutSeconds: timeoutSeconds,
              };

              // Save and persist the object to disk

              _data.create('checks', checkId, checkObject, function (err) {
                if (!err) {
                  // Add the check id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update('users', userPhone, userData, function (err) {
                    if (!err) {
                      // Return the data about the new check
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: 'Could not update the user with the new check',
                      });
                    }
                  });
                } else {
                  callback(500, { Error: 'Could not create the new check' });
                }
              });
            } else {
              callback(400, {
                Error:
                  'The user already has the maximum number of checks (' +
                  config.maxChecks +
                  ')',
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: 'Missing required inputs, or inputs are invalid' });
  }
};

// Checks - get
handlers._checks.get = function (data, callback) {
  const id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // Lookup the check
    _data.read('checks', id, function (err, checkData) {
      if (!err && checkData) {
        // Get the token from the headers
        const token =
          typeof data.headers.token == 'string' ? data.headers.token : false;

        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(
          token,
          checkData.userPhone,
          function (tokenIsValid) {
            if (tokenIsValid) {
              // Return the check data
              callback(200, checkData);
            } else {
              callback(403);
            }
          }
        );
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Checks - put
handlers._checks.put = function (data, callback) {
  const id =
    typeof data.payload.id == 'string' && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  // Validate inputs
  const protocol =
    typeof data.payload.protocol == 'string' &&
    ['http', 'https'].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;

  const url =
    typeof data.payload.url == 'string' && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  const method =
    typeof data.payload.method == 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;

  const successCodes =
    typeof data.payload.successCodes == 'object' &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == 'number' &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  // Error if the phone is invalid

  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      // Lookup the check
      _data.read('checks', id, function (err, checkData) {
        if (!err && checkData) {
          // Get the token from the headers
          const token =
            typeof data.headers.token == 'string' ? data.headers.token : false;

          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(
            token,
            checkData.userPhone,
            function (tokenIsValid) {
              if (tokenIsValid) {
                // Update the check where necessary
                if (protocol) {
                  checkData.protocol = protocol;
                }
                if (url) {
                  checkData.url = url;
                }
                if (method) {
                  checkData.method = method;
                }
                if (successCodes) {
                  checkData.successCodes = successCodes;
                }
                if (timeoutSeconds) {
                  checkData.timeoutSeconds = timeoutSeconds;
                }

                // Store the new updates
                _data.update('checks', id, checkData, function (err) {
                  if (!err) {
                    callback(200);
                  } else {
                    callback(500, { Error: 'Could not update the check' });
                  }
                });
              } else {
                callback(403);
              }
            }
          );
        } else {
          callback(400, { Error: 'Check ID did not exist' });
        }
      });
    } else {
      callback(400, { Error: 'Missing fields to update' });
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Checks - delete
handlers._checks.delete = function (data, callback) {
  // Validate id
  const id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // Lookup the check
    _data.read('checks', id, function (err, checkData) {
      if (!err && checkData) {
        // Get the token from the headers
        const token =
          typeof data.headers.token == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(
          token,
          checkData.userPhone,
          function (tokenIsValid) {
            if (tokenIsValid) {
              // Delete the check data
              _data.delete('checks', id, function (err) {
                if (!err) {
                  // Lookup the user
                  _data.read(
                    'users',
                    checkData.userPhone,
                    function (err, userData) {
                      if (!err && userData) {
                        const userChecks =
                          typeof userData.checks == 'object' &&
                          userData.checks instanceof Array
                            ? userData.checks
                            : [];

                        // Remove the deleted check from their list of checks
                        const checkPosition = userChecks.indexOf(id);

                        if (checkPosition > -1) {
                          userChecks.splice(checkPosition, 1);

                          // Re-save the user's data

                          _data.update(
                            'users',
                            checkData.userPhone,
                            userData,
                            function (err) {
                              if (!err) {
                                callback(200);
                              } else {
                                callback(500, {
                                  Error: 'Could not update the user',
                                });
                              }
                            }
                          );
                        } else {
                          callback(500, {
                            Error:
                              'Could not find the check on the user object, so could not remove it',
                          });
                        }
                      } else {
                        callback(500, {
                          Error:
                            'Could not find the user who created the check, so could not remove the check from the list of checks on the user object',
                        });
                      }
                    }
                  );
                } else {
                  callback(500, { Error: 'Could not delete the check data' });
                }
              });
            } else {
              callback(403);
            }
          }
        );
      } else {
        callback(400, { Error: 'The specified check ID does not exist' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Ping handler
handlers.hello = function (data, callback) {
  callback(200, { welcomeMessage: 'Hello world' });
};

// Incase handlers are not found
handlers.notFound = function (data, callback) {
  callback(404);
};

module.exports = handlers;
