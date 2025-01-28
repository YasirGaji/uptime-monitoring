// A CRUD Library to store, edit, and delete data

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers')

// module container
const lib = {};

// base directory for the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// converts data to a file
lib.create = function (dir, file, data, callback) {
  // opens file to write
  fs.open(
    lib.baseDir + dir + '/' + file + '.json',
    'wx',
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        // convert data to string
        let stringData = JSON.stringify(data);

        // write in file and close it
        fs.writeFile(fileDescriptor, stringData, function (err) {
          if (!err) {
            fs.close(fileDescriptor, function (err) {
              if (!err) {
                callback(false);
              } else {
                callback('Error closing new file');
              }
            });
          } else {
            callback('Error writing to new file');
          }
        });
      } else {
        callback('Could not create new file, it may already exist');
      }
    }
  );
};

// reads data in a file
lib.read = function (dir, file, callback) {
  fs.readFile(
    lib.baseDir + dir + '/' + file + '.json',
    'utf8',
    function (err, data) {
      if (!err && data) {
        const parsedData = helpers.parseJsonToObject(data);
        callback(false, parsedData);
      } else {
        callback(err, data);
      }
    }
  );
};

// updates data in file
lib.update = function (dir, file, data, callback) {
  //open file to edit
  fs.open(
    lib.baseDir + dir + '/' + file + '.json',
    'r+',
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        let stringData = JSON.stringify(data);

        // Truncate the existing file
        fs.ftruncate(fileDescriptor, function (err) {
          if (!err) {
            // edit file and close it
            fs.writeFile(fileDescriptor, stringData, function (err) {
              if (!err) {
                fs.close(fileDescriptor, function (err) {
                  if (!err) {
                    callback(false);
                  } else {
                    callback('Error closing existing file');
                  }
                });
              } else {
                callback('Error editing existing file');
              }
            });
          } else {
            callback('Error truncating file');
          }
        });
      } else {
        callback('Could not open the file for update it might not exist yet');
      }
    }
  );
};

// delete data in file
lib.delete = function (dir, file, callback) {
  // unlinking the file from the file system
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
    if (!err) {
      callback(false);
    } else {
      callback('Error deleting file');
    }
  });
};

// module export
module.exports = lib;
