const TABLE = 'transaction';
const utils = require('../../../utils/utils');

module.exports = function(injectedStore) {
    let store = injectedStore;
    if(!store){
        store = require('../../../store/mysql');
    }

    async function getTransactions(userId, walletId, year, month, categoryId){
        let query = "select t.id, t.wallet_id, w.name as wallet_name, t.date, t.amount, t.detail, c.id as category_id, c.name as category_name, c.type " +
            "from transaction t, category c, wallet w " +
            "where t.wallet_id=w.id and t.category_id=c.id and w.user_id=? and t.wallet_id=?";
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

    async function getProfitLoss(userId, walletId, categoryId){
        let query = "select DATE_FORMAT(t.date, '%Y-%m-01') as date, " +
            "       sum(case when c.type = 'income' then t.amount else 0 end) income, " +
            "       sum(case when c.type = 'expense' then t.amount else 0 end) expense, " +
            "       sum(case when c.type = 'income' then t.amount else -t.amount end) savings, " +
            "       w.starting_amount " +
            " from transaction t, category c, wallet w " +
            " where t.wallet_id = w.id and t.category_id = c.id and w.user_id = ? and w.id = ? ";
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

    return{
        getTransactions,
        getProfitLoss,
    };
};
