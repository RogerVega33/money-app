const logger = require("./logger");

function log(req, res, next){
    logger.writeRequest(req, res);
    next();
}

module.exports = log;