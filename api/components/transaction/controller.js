const TABLE = 'transaction';
const utils = require('../../../utils/utils');
const error = require('../../../utils/errors');
const constants = require('../../../utils/constants');

module.exports = function(injectedStore) {
    let store = injectedStore;
    if(!store){
        store = require('../../../store/mysql');
    }

    async function getTransactions(userId, walletId, year, month, categoryId){
        let query = "select t.id, w.id, w.name as wallet_name, t.date, t.amount, t.detail, c.id as category_id, c.name as category_name, c.type " +
            "from transaction t, category c, wallet w " +
            "where t.category_id=c.id and c.wallet_id=w.id and w.user_id=? and w.id=?";
        let queryParameters = [userId, walletId];
        if(year){
            query += " and year(t.date)=?";
            queryParameters.push(year);
            if(month){
                query += " and month(t.date)=?";
                queryParameters.push(month);
            }
        }
        if(categoryId){
            query += " and c.id=?";
            queryParameters.push(categoryId);
        }
        let results = await store.personalizedQuery(query, queryParameters);
        let totalIncome = 0;
        let totalExpense = 0;
        let transactions = results.map(transaction => {
            if(transaction.type==='income') totalIncome += transaction.amount;
            if(transaction.type==='expense') totalExpense += transaction.amount;

            return {
                id: transaction.id,
                walletId: transaction.wallet_id,
                walletName: transaction.wallet_name,
                date: transaction.date,
                amount: transaction.amount,
                detail: transaction.detail,
                categoryId: transaction.category_id,
                categoryName: transaction.category_name,
                type: transaction.type,
            }
        });
        let savings = totalIncome - totalExpense;
        return {
            transactions,
            totalIncome: utils.roundDecimals(totalIncome),
            totalExpense: utils.roundDecimals(totalExpense),
            savings: utils.roundDecimals(savings)
        }
    }

    async function getCryptoWalletTransactions(userId, walletId) {

        const wallet = await store.query('wallet', {id: walletId}, {user_id: userId});
        if(wallet[0]) {
            let transactions = await getCryptoTransactionsByWallet(wallet[0]);
            const totalPortfolio = transactions.reduce((acc, item) => acc + parseFloat(item.total), 0);
            return {
                transactions,
                totalIncome: utils.roundDecimals(totalPortfolio),
                totalExpense: utils.roundDecimals(0),
                savings: utils.roundDecimals(totalPortfolio)
            }
        }
    }

    async function getCryptoTransactionsByWallet(cryptoWallet) {
        const queryTotalCryptoTransactions = `SELECT p.amount, p.symbol, IFNULL(c.price, 0) AS price,
                (p.amount * IFNULL(c.price, 0)) AS total_value, c.updated_at
                FROM portfolio p LEFT JOIN crypto c ON p.symbol = c.symbol WHERE p.wallet_id = ?`
        let results = await store.personalizedQuery(queryTotalCryptoTransactions, [cryptoWallet.id]);
        return results.map(result => {
            return {
                id: result.id,
                walletId: result.wallet_id,
                walletName: cryptoWallet.wallet_name,
                date: result.updated_at,
                amount: result.amount,
                symbol: result.symbol,
                price: result.price,
                total: utils.roundDecimalsGetNumber(result.total_value),
                type: cryptoWallet.type,
            }
        });
    }

    async function getProfitLoss(userId, walletId, categoryId){
        let query = "select DATE_FORMAT(t.date, '%Y-%m-01') as date, " +
            "       sum(case when c.type = 'income' then t.amount else 0 end) income, " +
            "       sum(case when c.type = 'expense' then t.amount else 0 end) expense, " +
            "       sum(case when c.type = 'income' then t.amount else -t.amount end) savings, " +
            "       w.starting_amount " +
            " from transaction t, category c, wallet w " +
            " where c.wallet_id = w.id and t.category_id = c.id and w.user_id = ? and w.id = ? ";
        let queryParameters = [userId, walletId];
        if(categoryId){
            query += " and c.id= ? ";
            queryParameters.push(categoryId);
        }
        query += " group by DATE_FORMAT(t.date, '%Y-%m-01') order by DATE_FORMAT(t.date, '%Y-%m-01')";
        let results = await store.personalizedQuery(query, queryParameters);
        const startingAmount = results.length > 0 && results[0].starting_amount? results[0].starting_amount : 0;
        let acc = startingAmount;
        let profitLoss = results
            .map(r => ({...r, total: acc += r.savings}))
            .map(r => ({
                date: new Date(r.date),
                income: utils.roundDecimalsGetNumber(r.income),
                expense: utils.roundDecimalsGetNumber(r.expense),
                savings: utils.roundDecimalsGetNumber(r.savings),
                total: utils.roundDecimalsGetNumber(r.total),
            }));
        return{
            startingAmount: utils.roundDecimalsGetNumber(startingAmount),
            profitLoss,
        }
    }

    async function saveTransaction(userId, transaction){
        if(!transaction.date || !transaction.amount || !transaction.categoryId)
            throw error('Bad request', constants.http.bad_request, false);
        let query = "select * from category c, wallet w where c.wallet_id = w.id and w.user_id = ? and c.id= ?";
        let queryParameters = [userId, transaction.categoryId];
        let result = await store.personalizedQuery(query, queryParameters);
        if(result[0]){
            return store.insert(TABLE, {
                date: new Date(transaction.date),
                amount: transaction.amount,
                detail: transaction.detail,
                category_id: transaction.categoryId
            });
        }
        throw error('Bad request', constants.http.bad_request, false);
    }

    return{
        getTransactions,
        getCryptoWalletTransactions,
        getCryptoTransactionsByWallet,
        getProfitLoss,
        saveTransaction,
    };
};
