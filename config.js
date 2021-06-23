var config = {}

config.endpoint = "wss://<yourservername>.gremlin.cosmosdb.azure.com:443/gremlin";
config.primaryKey = "<your primary key as can be found under keys in Azure>" 
config.database = "<name of the database>";
config.collection = "<name of the collection>";
config.port = 3001;

module.exports = config;