const express = require('express');
const router = express.Router();
const response = require('../../../network/response');
const constants = require('../../../utils/constants');
const controller = require('./index');
const secure = require('../../../auth/secure');

//ROUTES
router.get('/', secure(), getCategories);
router.post('/', secure(), saveCategory);

//FUNCTIONS
function getCategories(req, res, next) {
    controller.getCategories(req.userId, req.query.walletId)
        .then(resultList => {
            response.success(req, res, resultList, constants.http.ok);
        })
        .catch(next);
}

function saveCategory(req, res, next) {
    controller.saveCategory(req.userId, req.body)
        .then(resultList => {
            response.success(req, res, resultList, constants.http.ok);
        })
        .catch(next);
}

module.exports = router;
