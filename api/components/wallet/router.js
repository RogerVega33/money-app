const express = require('express');
const router = express.Router();
const response = require('../../../network/response');
const constants = require('../../../utils/constants');
const controller = require('./index');
const secure = require('../../../auth/secure');

//ROUTES
router.get('/', secure(), getWallets);
router.post('/', secure(), saveWallet);

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

module.exports = router;
