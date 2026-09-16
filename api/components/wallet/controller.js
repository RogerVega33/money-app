const validate = require('../../../utils/dataValidation');
const TABLE = 'wallet';
const error = require('../../../utils/errors');
const constants = require('../../../utils/constants');
const utils = require('../../../utils/utils');
const cryptoPriceService = require('./cryptoPriceService');


module.exports = function(injectedStore) {
    let store = injectedStore;
    if(!store){
        store = require('../../../store/mysql');
    }
    const cryptoPrice = cryptoPriceService(store);
    const transactionsController = require('../transaction/controller')(store);

    async function getWallets(userId, refreshPrices = true){
        let wallets;

        const query = "select id, name, starting_amount, detail, type, exclude_from_total, is_archived, " +
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
                excludeFromTotal: Boolean(wallet.exclude_from_total),
                isArchived: Boolean(wallet.is_archived),
            }
        });

        // Obtengo las crypto wallets del usuario
        const queryCryptoWallets = "select id, name, starting_amount, detail, type, exclude_from_total, is_archived " +
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
            if (refreshPrices) await cryptoPrice.refreshStalePrices([...allSymbols], userId);

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
                    excludeFromTotal: Boolean(cw.exclude_from_total),
                    isArchived: Boolean(cw.is_archived),
                });
            }
        }

        return wallets;
    }

    async function ensureUniqueName(userId, name, excludedId = 0) {
        const matches = await store.personalizedQuery(
            'SELECT id FROM wallet WHERE user_id = ? AND LOWER(TRIM(name)) = LOWER(?) AND id <> ? LIMIT 1',
            [userId, name, excludedId]
        );
        if (matches.length) throw error('Ya existe una billetera con ese nombre', constants.http.conflict, false);
    }

    async function saveWallet(userId, wallet){
        wallet = validate.wallet(wallet);
        await ensureUniqueName(userId, wallet.name);

        const newWallet = {
            name: wallet.name,
            detail: wallet.detail || '',
            user_id: userId,
            starting_amount: wallet.startingAmount || 0,
            type: wallet.type || 'fiat',
            exclude_from_total: Number(wallet.excludeFromTotal),
            is_archived: 0,
        };
        await store.insert(TABLE, newWallet);
        return { message: 'Operación exitosa' };
    }

    async function updateWallet(userId, wallet) {
        validate.object(wallet);
        const id = validate.integer(wallet.id, 'La billetera');
        const wallets = await store.query(TABLE, { id }, { user_id: userId });
        if (!wallets[0]) throw error('Not found', constants.http.not_found, false);
        const changes = validate.walletUpdate(wallet, wallets[0].type);
        await ensureUniqueName(userId, changes.name, id);
        await store.update(TABLE, changes, { id });
        return { message: 'Operación exitosa' };
    }

    return{
        updateWallet,
        getWallets,
        saveWallet,
    };
};
