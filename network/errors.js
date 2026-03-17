const constants = require('../utils/constants');
const response = require('./response');
const { getCurrentTime } = require('./logger')

function errors(err, req, res, next){
    if (err.message?.startsWith('Not allowed by CORS')) {
        console.warn(`[${getCurrentTime()}] [warn]:${err.message}`);
        return response.error(req, res, 'Forbidden', constants.http.forbidden);
    }

    if(err.logged) console.log(`[${getCurrentTime()}] [error]:${err}`);

    const message = err.message || 'Internal server error';
    const status = err.statusCode || constants.http.internal_server_error;

    response.error(req, res, message, status);
}

module.exports = errors;