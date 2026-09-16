const express = require('express');
const router = express.Router();
const response = require('../../../network/response');
const constants = require('../../../utils/constants');
const controller = require('./index');
const secure = require('../../../auth/secure');
const { transactionsChanged } = require('../../../network/realtime');

//ROUTES
router.get('/', secure(), getTransactions);
router.post('/', secure(), saveTransaction);
router.put('/', secure(), updateTransaction);
router.delete('/', secure(), deleteTransaction);
router.get('/profitLoss', secure(), getProfitLoss);
router.get('/crypto', secure(), getCryptoWalletTransactions);
router.post('/crypto', secure(), saveCriptoTransaction);
router.put('/crypto', secure(), updateCriptoTransaction);
router.delete('/crypto', secure(), deleteCriptoTransaction);

//FUNCTIONS
function getTransactions(req, res, next) {
    controller.getTransactions(req.userId, req.query.walletId, req.query.year, req.query.month, req.query.categoryId, req.query.startMonth, req.query.endMonth)
        .then(resultList => {
            response.success(req, res, resultList, constants.http.ok);
        })
        .catch(next);
}

function getCryptoWalletTransactions(req, res, next) {
    controller.getCryptoWalletTransactions(req.userId, req.query.walletId, req.query.refreshPrices !== 'false')
        .then(resultList => {
            response.success(req, res, resultList, constants.http.ok);
        })
        .catch(next);
}

function getProfitLoss(req, res, next) {
    controller.getProfitLoss(req.userId, req.query.walletId)
        .then(resultList => {
            response.success(req, res, resultList, constants.http.ok);
        })
        .catch(next);
}

function saveTransaction(req, res, next) {
    controller.saveTransaction(req.userId, req.body)
        .then(result => {
            transactionsChanged(req);
            response.success(req, res, result, constants.http.ok);
        })
        .catch(next);
}

function saveCriptoTransaction(req, res, next) {
    controller.saveCriptoTransaction(req.userId, req.body)
        .then(result => {
            transactionsChanged(req);
            response.success(req, res, {}, result);
        })
        .catch(next);
}

function updateCriptoTransaction(req, res, next) {
    controller.updateCriptoTransaction(req.userId, req.body)
        .then(result => {
            transactionsChanged(req);
            response.success(req, res, {}, result);
        })
        .catch(next);
}

function updateTransaction(req, res, next) {
    controller.updateTransaction(req.userId, req.body)
        .then(result => {
            transactionsChanged(req);
            response.success(req, res, {}, result);
        })
        .catch(next);
}

function deleteCriptoTransaction(req, res, next) {
    controller.deleteCriptoTransaction(req.userId, req.query.transactionId)
        .then(result => {
            transactionsChanged(req);
            response.success(req, res, result, constants.http.ok);
        })
        .catch(next);
}

function deleteTransaction(req, res, next) {
    controller.deleteTransaction(req.userId, req.query.transactionId)
        .then(result => {
            transactionsChanged(req);
            response.success(req, res, result, constants.http.ok);
        })
        .catch(next);
}

module.exports = router;
