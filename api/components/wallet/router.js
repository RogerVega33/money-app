const express = require('express');
const router = express.Router();
const response = require('../../../network/response');
const constants = require('../../../utils/constants');
const controller = require('./index');
const secure = require('../../../auth/secure');

//ROUTES
router.get('/', secure(), getWallets);
router.post('/', secure(), saveWallet);
router.put('/', secure(), updateWallet);

//FUNCTIONS
function getWallets(req, res, next) {
    controller.getWallets(req.userId)
        .then(resultList => {
            response.success(req, res, resultList, constants.http.ok);
        })
        .catch(next);
}

function saveWallet(req, res, next) {
    controller.saveWallet(req.userId, req.body)
        .then(resultList => {
            response.success(req, res, resultList, constants.http.ok);
        })
        .catch(next);
}

function updateWallet(req, res, next) {
    controller.updateWallet(req.userId, req.body)
        .then(result => {
            response.success(req, res, result, constants.http.ok);
        })
        .catch(next);
}

module.exports = router;
