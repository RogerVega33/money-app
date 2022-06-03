const express = require('express');
const router = express.Router();
const response = require('../../../network/response');
const constants = require('../../../utils/constants');
const controller = require('./index');
const secure = require('../../../auth/secure');

//ROUTES
router.get('/', secure(), getTransactions);

//FUNCTIONS
function getTransactions(req, res, next) {
    controller.getTransactions(req.userId, req.query.walletId, req.query.year, req.query.month, req.query.categoryId)
        .then(resultList => {
            response.success(req, res, resultList, constants.http.ok);
        })
        .catch(next);
}

module.exports = router;
