const express = require('express');
const router = express.Router();
const response = require('../../../network/response');
const constants = require('../../../utils/constants');
const controller = require('./index');
const secure = require('../../../auth/secure');

//ROUTES
router.get('/', secure(), getWallets);

//FUNCTIONS
function getWallets(req, res, next) {
    controller.getWallets(req.userId)
        .then(resultList => {
            response.success(req, res, resultList, constants.http.ok);
        })
        .catch(next);
}

module.exports = router;
