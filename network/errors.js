const constants = require('../utils/constants');
const response = require('./response');

function errors(err, req, res, next){
    if (err.message?.startsWith('Not allowed by CORS')) {
        return response.error(req, res, 'Forbidden', constants.http.forbidden);
    }

    res.locals.logError = err;

    const message = err.message || 'Internal server error';
    const status = err.statusCode || constants.http.internal_server_error;

    response.error(req, res, message, status);
}

module.exports = errors;