const validate = require('../../../utils/dataValidation');
const TABLE = 'transaction';
const utils = require('../../../utils/utils');
const error = require('../../../utils/errors');
const constants = require('../../../utils/constants');
const cryptoPriceService = require('../wallet/cryptoPriceService');

module.exports = function(injectedStore) {
    let store = injectedStore;
    if(!store){
        store = require('../../../store/mysql');
    }
    const cryptoPrice = cryptoPriceService(store);

    async function getTransactions(userId, walletId, year, month, categoryId, startMonth, endMonth){
        walletId = validate.integer(walletId, 'La billetera');
        if (categoryId !== undefined) categoryId = validate.integer(categoryId, 'La categoría');
        if (year !== undefined) year = validate.integer(year, 'El año', 1000, 9999);
        if (month !== undefined) {
            month = validate.integer(month, 'El mes', 1, 12);
            if (year === undefined) throw error('El mes requiere un año.', 400, false);
        }
        let rangeStart, rangeEnd
        if (startMonth !== undefined || endMonth !== undefined) {
            if (year !== undefined || month !== undefined) throw error('El rango no se puede combinar con mes o año', 400, false);
            const parseMonth = value => {
                if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) throw error('El rango requiere un mes inicial y final con formato YYYY-MM', 400, false);
                const [y, m] = value.split('-').map(Number);
                validate.integer(y, 'El año', 2000, new Date().getFullYear() + 1);
                validate.integer(m, 'El mes', 1, 12);
                return { y, m };
            };
            parseMonth(startMonth);
            const end = parseMonth(endMonth);
            if (startMonth > endMonth) throw error('El inicio del rango no puede ser posterior al final', 400, false);
            rangeStart = `${startMonth}-01`;
            rangeEnd = `${end.m === 12 ? end.y + 1 : end.y}-${String(end.m === 12 ? 1 : end.m + 1).padStart(2, '0')}-01`;
        }
        let query = "select t.id, w.id as wallet_id, w.name as wallet_name, t.date, t.amount, t.detail, c.id as category_id, c.name as category_name, c.type " +
            "from transaction t, category c, wallet w " +
            "where t.category_id=c.id and c.wallet_id=w.id and w.user_id=? and w.id=?";
        let queryParameters = [userId, walletId];
        if (rangeStart) {
            query += ' and t.date >= ? and t.date < ?';
            queryParameters.push(rangeStart, rangeEnd);
        }
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
                date: transaction.date.split('T')[0],
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

    async function getCryptoWalletTransactions(userId, walletId, refreshPrices = true) {
        walletId = validate.integer(walletId, 'La billetera');

        const wallet = await store.query('wallet', {id: walletId}, {user_id: userId});
        if(wallet[0]) {
            const portfolio = await store.query('portfolio', {wallet_id: walletId});
            const symbols = [...new Set(portfolio.map(item => item.symbol))];
            if (refreshPrices) await cryptoPrice.refreshStalePrices(symbols, userId);

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

    async function getCryptoTransactionsByWallet(cryptoWallet, failedSymbols = cryptoPrice.failedSymbols) {
        const queryTotalCryptoTransactions = `SELECT p.id, p.amount, CAST(p.amount AS CHAR) AS exact_amount, p.symbol, IFNULL(c.price, 0) AS price, c.price IS NOT NULL AS has_price,
                (p.amount * IFNULL(c.price, 0)) AS total_value, c.updated_at
                FROM portfolio p LEFT JOIN crypto c ON p.symbol = c.symbol WHERE p.wallet_id = ?`
        let results = await store.personalizedQuery(queryTotalCryptoTransactions, [cryptoWallet.id]);
        return results.map(result => {
            return {
                id: result.id,
                walletId: cryptoWallet.id,
                walletName: cryptoWallet.name,
                date: result.updated_at,
                amount: result.amount,
                exactAmount: result.exact_amount,
                symbol: result.symbol,
                price: result.price,
                hasPrice: Boolean(result.has_price),
                priceUpdateFailed: failedSymbols.has(result.symbol),
                total: utils.roundDecimalsGetNumber(result.total_value),
                type: cryptoWallet.type,
            }
        });
    }

    async function getProfitLoss(userId, walletId, categoryId){
        walletId = validate.integer(walletId, 'La billetera');
        if (categoryId !== undefined) categoryId = validate.integer(categoryId, 'La categoría');
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
        const profitLoss = [];
        // Índices de mes evitan conversiones de zona horaria y cubren cambios de año.
        const monthIndex = date => {
            const [year, month] = date.split('-').map(Number);
            return year * 12 + month - 1;
        };
        let nextMonth = results.length ? monthIndex(results[0].date) : 0;
        for (const row of results) {
            const currentMonth = monthIndex(row.date);
            while (nextMonth < currentMonth) {
                const year = Math.floor(nextMonth / 12);
                const month = String(nextMonth % 12 + 1).padStart(2, '0');
                profitLoss.push({
                    date: `${year}-${month}-01`,
                    income: 0,
                    expense: 0,
                    savings: 0,
                    total: utils.roundDecimalsGetNumber(acc),
                });
                nextMonth++;
            }
            acc += row.savings;
            profitLoss.push({
                date: row.date,
                income: utils.roundDecimalsGetNumber(row.income),
                expense: utils.roundDecimalsGetNumber(row.expense),
                savings: utils.roundDecimalsGetNumber(row.savings),
                total: utils.roundDecimalsGetNumber(acc),
            });
            nextMonth = currentMonth + 1;
        }
        return{
            startingAmount: utils.roundDecimalsGetNumber(startingAmount),
            profitLoss,
        }
    }

    async function saveTransaction(userId, transaction){
        transaction = validate.transaction(transaction, false, false);
        let query = "select c.*, w.type AS wallet_type from category c, wallet w where c.wallet_id = w.id and w.user_id = ? and c.id= ?";
        let queryParameters = [userId, transaction.categoryId];
        let result = await store.personalizedQuery(query, queryParameters);
        if(result[0]){
            if (result[0].wallet_type !== 'fiat') throw error('Las transacciones fiat requieren una billetera fiat', constants.http.bad_request, false);
            await store.insert(TABLE, {
                date: transaction.date,
                amount: transaction.amount,
                detail: transaction.detail,
                category_id: transaction.categoryId
            });
            return { message: 'Transacción creada correctamente.' };
        }
        throw error('Bad request', constants.http.bad_request, false);
    }

    async function saveCriptoTransaction(userId, transaction){
        transaction = validate.transaction(transaction, true, false);

        // Primero verifica si la wallet existe y es del usuario
        const wallet = await store.query('wallet', {id: transaction.walletId}, {user_id: userId});

        if(wallet[0]) {
            if (wallet[0].type !== 'crypto') throw error('Las transacciones cripto requieren una billetera cripto', constants.http.bad_request, false);
            // verifica si ya existe un registro con ese symbol para actualizar su monto
            const portfolioTransaction = await store.personalizedQuery(
                'SELECT id, CAST(amount AS CHAR) AS amount FROM portfolio WHERE wallet_id = ? AND symbol = ?',
                [transaction.walletId, transaction.symbol]);
            if(portfolioTransaction[0]){
                const newAmount = validate.addCryptoAmounts(transaction.amount, portfolioTransaction[0].amount);
                await store.update('portfolio', {amount: newAmount}, {id: portfolioTransaction[0].id});
                return constants.http.ok;
            }
            // ingresa un nuevo registro
            await store.insert('portfolio', {
                wallet_id: transaction.walletId,
                symbol: transaction.symbol,
                amount: transaction.amount,
            });
            return constants.http.created;
        }
        throw error('Not found', constants.http.not_found, false);
    }

    async function updateCriptoTransaction(userId, transaction){
        transaction = validate.transaction(transaction, true, true);

        // Primero verifica que la transacción existe
        const cryptoTransaction = await store.query('portfolio', {id: transaction.id}, {symbol: transaction.symbol});
        if(cryptoTransaction[0]) {
            // valida que la wallet sea del usuario
            const wallet = await store.query('wallet', {id: cryptoTransaction[0].wallet_id}, {user_id: userId});
            if(wallet[0]) {
                if (wallet[0].type !== 'crypto') throw error('Las transacciones cripto requieren una billetera cripto', constants.http.bad_request, false);
                await store.update('portfolio', {amount: transaction.amount}, {id: transaction.id});
                return constants.http.ok;
            }
        }
        throw error('Not found', constants.http.not_found, false);
    }

    async function updateTransaction(userId, transaction){
        transaction = validate.transaction(transaction, false, true);

        // Primero verifica que la transacción existe
        const transactionOriginal = await store.query(TABLE, {id: transaction.id});
        if(transactionOriginal[0]) {
            // valida que la wallet sea del usuario
            let query = "select c.*, w.type AS wallet_type from category c, wallet w where c.wallet_id = w.id and w.user_id = ? and c.id= ?";
            let queryParameters = [userId, transactionOriginal[0].category_id];
            let result = await store.personalizedQuery(query, queryParameters);
            if(result[0]) {
                const destinationCategory = await store.personalizedQuery(query, [userId, transaction.categoryId]);
                if (!destinationCategory[0]) throw error('Not found', constants.http.not_found, false);
                if (destinationCategory[0].wallet_type !== 'fiat') throw error('Las transacciones fiat requieren una billetera fiat', constants.http.bad_request, false);

                await store.update(TABLE, {
                    amount: transaction.amount,
                    detail: transaction.detail,
                    category_id: transaction.categoryId,
                    date: transaction.date,
                }, {id: transaction.id});
                return constants.http.ok;
            }
        }
        throw error('Not found', constants.http.not_found, false);
    }

    async function deleteCriptoTransaction(userId, transactionId){
        transactionId = validate.integer(transactionId, 'La transacción');

        // Primero verifica que la transacción existe
        const cryptoTransaction = await store.query('portfolio', {id: transactionId});
        if(cryptoTransaction[0]) {
            // valida que la wallet sea del usuario
            const wallet = await store.query('wallet', {id: cryptoTransaction[0].wallet_id}, {user_id: userId});
            if(wallet[0]) {
                await store.deleteData('portfolio', {id: transactionId});
                return { message: 'Operación exitosa' };
            }
        }
        throw error('Not found', constants.http.not_found, false);
    }

    async function deleteTransaction(userId, transactionId){
        transactionId = validate.integer(transactionId, 'La transacción');

        // Primero verifica que la transacción existe
        const transaction = await store.query(TABLE, {id: transactionId});
        if(transaction[0]) {
            // valida que la wallet sea del usuario
            let query = "select c.*, w.type AS wallet_type from category c, wallet w where c.wallet_id = w.id and w.user_id = ? and c.id= ?";
            let queryParameters = [userId, transaction[0].category_id];
            let result = await store.personalizedQuery(query, queryParameters);
            if(result[0]) {
                await store.deleteData(TABLE, {id: transactionId});
                return { message: 'Operación exitosa' };
            }
        }
        throw error('Not found', constants.http.not_found, false);
    }

    return{
        getTransactions,
        getCryptoWalletTransactions,
        getCryptoTransactionsByWallet,
        getProfitLoss,
        saveTransaction,
        saveCriptoTransaction,
        updateCriptoTransaction,
        deleteCriptoTransaction,
        deleteTransaction,
        updateTransaction,
    };
};
