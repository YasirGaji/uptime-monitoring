// Configuration variables 


// environment containers
const environments = {}

// staging environments
environments.staging = {
  'port' : 3001,
  'envName' : 'staging'
}

// production environment 
environments.production = {
  'port' : 5000,
  'envName' : 'production'
}

// checks the environment passed as an arrguement in the command line
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// checks for environment key or result default to staging
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;


//export 
module.exports = environmentToExport;