const express = require('express');
const router = express.Router();
const response = require('../../../network/response');
const constants = require('../../../utils/constants');
const controller = require('./index');
const config = require('../../../config.js');
const secure = require('../../../auth/secure');

//ROUTES
router.post('/login', login);
router.post('/password/change', changePassword);
if(config.api.env === 'dev') router.post('/hash', secure(), getHash);

function login(req, res){
    controller.login(req.body.username, req.body.password)
        .then(body => {
            response.success(req, res, body, constants.http.ok);
        })
        .catch( error => {
            response.error(req, res, error.message, constants.http.bad_request);
        });
}

function changePassword(req, res){
    controller.changePassword(req.body.email, req.body.oldPassword, req.body.newPassword)
        .then(body => {
            response.success(req, res, body, constants.http.ok);
        })
        .catch(error => {
            response.error(req, res, 'Información incorrecta', constants.http.not_found);
        })
}

function getHash(req, res){
    controller.getHash(req.body.text)
        .then(result => {
            response.success(req, res, result, constants.http.ok);
        })
        .catch( error => {
            response.error(req, res, error.message, constants.http.bad_request);
        });
}

module.exports = router;