const constants = require('../utils/constants');
const response = require('./response');

function errors(req, res, next){
    const message = 'Not found';
    const status = constants.http.not_found;

    response.error(req, res, message, status);
}

module.exports = errors;
