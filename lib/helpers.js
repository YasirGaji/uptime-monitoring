const crypto = require('crypto');
const config = require('./config')



const helpers = {};


// A SHA256 hash
helpers.hash = function(str) {
  if(typeof(str) == 'string' && str.length > 0){
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash
  } else {
    return false;
  }
}

// Parses JSON to string to object without throwing in all cases
helpers.parseJsonToObject = function(str){
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch(e) {
    return {}
  }
}

// Create a string of random alphanumeric characters of a given length
helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';
    for(let i = 1; i <= strLength; i++){
      const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      str += randomCharacter;
    }
    return str;
  } else {
    return false;
  }
}

helpers.sendTwilioSms = function(phone, msg, callback){
  // Validate parameters
  phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;

  msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

  if(phone && msg){
    // Configure the request payload
    const payload = {
      'From' : config.twilio.fromPhone,
      'To' : '+1'+phone,
      'Body' : msg
    };
    const stringPayload = querystring.stringify(payload);
    // Configure the request details
    const requestDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.twilio.com',
      'method' : 'POST',
      'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
      'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };
    // Instantiate the request object
    const req = https.request(requestDetails, function(res){
      // Grab the status of the sent request
      const status =  res.statusCode;
      // Callback successfully if the request went through
      if(status == 200 || status == 201){
        callback(false);
      } else {
        callback('Status code returned was '+status);
      }
    });
    // Bind to the error event so it doesn't get thrown
    req.on('error', function(e){
      callback(e);
    });
    // Add the payload
    req.write(stringPayload);
    // End the request
    req.end();
  } else {
    callback('Given parameters were missing or invalid');
  }
}



module.exports = helpers;