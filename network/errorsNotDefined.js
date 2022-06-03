const constants = require('../utils/constants');
const response = require('./response');

function errors(req, res, next){
    const message = 'Internal server error';
    const status = constants.http.internal_server_error;

    response.error(req, res, message, status);
}

module.exports = errors;