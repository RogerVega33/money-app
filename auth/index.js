const jwt = require('jsonwebtoken');
const config = require('../config');
const constants = require('../utils/constants');
const error = require('../utils/errors');

const secret = config.jwt.secret;

function decodedToken(token){
    try{
        return jwt.verify(token, secret, {
            algorithms: ['HS256']
        });
    }catch(err){
        throw error('Forbidden', constants.http.forbidden, false);
    }
}

function sign(data){
    return jwt.sign(data, secret, {
        expiresIn: "1d",
        algorithm: "HS256"
    });
}

const check = {
    user: function(req){
        return decodeHeader(req);
    }
};

function getToken(bearerString){
    if(!bearerString || !bearerString.startsWith('Bearer ')){
        throw error('Error en el token de autenticación', constants.http.bad_request, false);
    }
    return bearerString.slice(7);
}

function decodeHeader(req){
    const authorization = req.headers.authorization || '';
    const token = getToken(authorization);
    return decodedToken(token);
}

module.exports = {
    sign,
    check,
};