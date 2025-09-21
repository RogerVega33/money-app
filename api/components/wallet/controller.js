const axios = require("axios");

const TABLE = 'wallet';
const utils = require('../../../utils/utils');
const transactionsController = require('../transaction')


module.exports = function(injectedStore) {
    let store = injectedStore;
    if(!store){
        store = require('../../../store/mysql');
    }

    async function getWallets(userId){
        let wallets;

        const query = "select id, name, starting_amount, type, " +
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
                type: wallet.type,
            }
        });

        // Obtengo las crypto wallets del usuario
        const queryCryptoWallets = "select id, name, starting_amount, type " +
            "from wallet w where id in (select id from wallet where user_id = ?) and type = 'crypto'";
        let cryptoWallets = await store.personalizedQuery(queryCryptoWallets, [userId]);
        console.info("Cripto wallets", cryptoWallets)
        // si tiene crypto wallets entonces consulta su portafolio
        if(cryptoWallets[0]){
            for (let cw of cryptoWallets) {
                cryptoWallet = cw
                let portfolio = await store.query('portfolio', {wallet_id: cryptoWallet.id});
                // Consulta el valor de cada moneda del portafolio y lo actualiza
                const symbolsToUpdate = [...new Set(portfolio.map(p => p.symbol))];
                console.info("symbolsToUpdate",symbolsToUpdate)
                for (const symbol of symbolsToUpdate) {
                    await updateCryptoPrice(symbol);
                }
                let cryptoTransactionsByWallet = await transactionsController.getCryptoTransactionsByWallet(cryptoWallet);
                const totalPortfolio = cryptoTransactionsByWallet.reduce((acc, item) => acc + parseFloat(item.total), 0);
                wallets.push({
                    id: cryptoWallet.id,
                    name: cryptoWallet.name,
                    startingAmount: utils.roundDecimals(cryptoWallet.starting_amount),
                    totalIncome: utils.roundDecimals(totalPortfolio),
                    totalExpense: 0,
                    total: utils.roundDecimals(totalPortfolio),
                    type: cryptoWallet.type,
                })
            }
        }

        return wallets;
    }

    async function saveWallet(userId, wallet){
        const newWallet = {
            name: wallet.name,
            detail: wallet.detail || '',
            user_id: userId,
            starting_amount: wallet.startingAmount || 0
        };
        return store.insert(TABLE, newWallet);
    }

    async function updateCryptoPrice(symbol) {
        let price;
        let now = new Date();

        try {
            if (symbol === "USDT" || symbol === "USDC") {
                price = 1.0;
            } else {
                console.log(`Consultando en Binance el valor de ${symbol}`)
                const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`;
                const response = await axios.get(url, { timeout: 5000 });
                price = parseFloat(response.data.price);
            }
            console.log(`Precio de ${symbol} : ${price} USDT`)
            const query = `INSERT INTO crypto (symbol, price, updated_at) VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE price = ?, updated_at = ?`;
            await store.personalizedQuery(query, [symbol, price, now, price, now]);
        } catch (err) {
            console.error(`Error al consultar en Binance el valor de ${symbol}: ${err.message}`);
        }
    }

    return{
        getWallets,
        saveWallet,
    };
};
