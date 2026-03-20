const TABLE = 'wallet';
const utils = require('../../../utils/utils');
const cryptoPriceService = require('./cryptoPriceService');
const transactionsController = require('../transaction')

module.exports = function(injectedStore) {
    let store = injectedStore;
    if(!store){
        store = require('../../../store/mysql');
    }
    const cryptoPrice = cryptoPriceService(store);

    async function getWallets(userId){
        let wallets;

        const query = "select id, name, starting_amount, detail, type, " +
            "(select ifnull(sum(amount), 0) from transaction where category_id in (select id from category c where c.wallet_id=w.id and type = 'income')) AS total_income, " +
            "(select ifnull(sum(amount), 0) from transaction where category_id in (select id from category c where c.wallet_id=w.id and type = 'expense')) AS total_expense, " +
            "(select starting_amount + total_income - total_expense) as total " +
            "from wallet w where id in (select id from wallet where user_id = ?) and type = 'fiat'";
        let results = await store.personalizedQuery(query, [userId]);
        wallets = results.map(wallet => {
            return {
                id: wallet.id,
                name: wallet.name,
                startingAmount: utils.roundDecimals(wallet.starting_amount),
                totalIncome: utils.roundDecimals(wallet.total_income),
                totalExpense: utils.roundDecimals(wallet.total_expense),
                total: utils.roundDecimals(wallet.total),
                detail: wallet.detail,
                type: wallet.type,
            }
        });

        // Obtengo las crypto wallets del usuario
        const queryCryptoWallets = "select id, name, starting_amount, detail, type " +
            "from wallet w where id in (select id from wallet where user_id = ?) and type = 'crypto'";
        let cryptoWallets = await store.personalizedQuery(queryCryptoWallets, [userId]);

        // si tiene crypto wallets entonces consulta su portafolio
        if(cryptoWallets[0]){
            // Recolecta portfolios y símbolos únicos de todas las wallets en paralelo
            const portfoliosByWallet = new Map();
            const allSymbols = new Set();

            await Promise.all(cryptoWallets.map(async (cw) => {
                const portfolio = await store.query('portfolio', { wallet_id: cw.id });
                portfoliosByWallet.set(cw.id, portfolio);
                portfolio.forEach(p => allSymbols.add(p.symbol));
            }));

            // Actualiza precios de la base de datos
            await cryptoPrice.refreshStalePrices([...allSymbols]);

            // Construye los datos de cada wallet
            for (let cw of cryptoWallets) {
                let cryptoTransactionsByWallet = await transactionsController.getCryptoTransactionsByWallet(cw);
                const totalPortfolio = cryptoTransactionsByWallet.reduce(
                    (acc, item) => acc + parseFloat(item.total), 0
                );
                wallets.push({
                    id: cw.id,
                    name: cw.name,
                    startingAmount: utils.roundDecimals(cw.starting_amount),
                    totalIncome: utils.roundDecimals(totalPortfolio),
                    totalExpense: 0,
                    total: utils.roundDecimals(totalPortfolio),
                    detail: cw.detail,
                    type: cw.type,
                });
            }
        }

        return wallets;
    }

    async function saveWallet(userId, wallet){
        const newWallet = {
            name: wallet.name,
            detail: wallet.detail || '',
            user_id: userId,
            starting_amount: wallet.startingAmount || 0,
            type: wallet.type || 'fiat',
        };
        return store.insert(TABLE, newWallet);
    }

    return{
        getWallets,
        saveWallet,
    };
};
