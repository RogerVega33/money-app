const constants = require('../utils/constants');
const response = require('./response');

function errors(err, req, res, next){
    if(err.logged) console.log('[error] ', err);

    const message = err.message || 'Internal server error';
    const status = err.statusCode || constants.http.internal_server_error;

    response.error(req, res, message, status);
}

module.exports = errors;