// Configuration variables 


// environment containers
const environments = {}

// staging environments
environments.staging = {
  'httpPort' : 3001,
  'httpsPort' : 3002,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecret'
}

// production environment 
environments.production = {
  'httpPort' : 5002,
  'httpsPort' : 5003,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret'

}

// checks the environment passed as an arrguement in the command line
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// checks for environment key or result default to staging
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;


//export 
module.exports = environmentToExport;