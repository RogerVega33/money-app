const express = require('express');
const router = express.Router();
const response = require('../../../network/response');
const constants = require('../../../utils/constants');
const controller = require('./index');
const config = require('../../../config.js');
const secure = require('../../../auth/secure');
const { createAuthRateLimit } = require('../../../auth/rateLimit');
const limits = createAuthRateLimit(config.authRateLimit);

router.use(limits.ip);

//ROUTES
router.post('/login', limits.account('login'), login);
router.post('/password/change', limits.account('changePassword'), changePassword);
router.post('/user', createUser);
router.post('/user/recoverUser', limits.account('recovery'), recoverUser);

if(config.api.env === 'dev') router.post('/hash', secure(), getHash);

function createUser(req, res) {
    controller.createUser(req.body.username, req.body.password)
        .then(body => {
            response.success(req, res, body, constants.http.created);
        })
        .catch( error => {
            response.error(req, res, error.message, constants.http.bad_request);
        });
}

function recoverUser(req, res) {
    controller.recoverUser(req.body)
        .then(body => {
            res.locals.authAttempt.finish('success');
            response.success(req, res, body, constants.http.ok);
        })
        .catch( error => {
            res.locals.authAttempt.finish(error.authenticationFailed ? 'failure' : 'neutral');
            response.error(req, res, error.message, constants.http.bad_request);
        });
}

function login(req, res){
    controller.login(req.body.username, req.body.password)
        .then(body => {
            res.locals.authAttempt.finish('success');
            response.success(req, res, body, constants.http.ok);
        })
        .catch( error => {
            res.locals.authAttempt.finish(error.authenticationFailed ? 'failure' : 'neutral');
            response.error(req, res, error.message, constants.http.bad_request);
        });
}

function changePassword(req, res){
    controller.changePassword(req.body.username, req.body.oldPassword, req.body.newPassword)
        .then(body => {
            res.locals.authAttempt.finish('success');
            response.success(req, res, body, constants.http.ok);
        })
        .catch(error => {
            res.locals.authAttempt.finish(error.authenticationFailed ? 'failure' : 'neutral');
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
