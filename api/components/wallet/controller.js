const TABLE = 'wallet';
const utils = require('../../../utils/utils');

module.exports = function(injectedStore) {
    let store = injectedStore;
    if(!store){
        store = require('../../../store/mysql');
    }

    async function getWallets(userId){
        const query = "select id, name, starting_amount, " +
            "(select ifnull(sum(amount), 0) from transaction where wallet_id=w.id AND category_id in (select id from category where wallet_id=w.id and type = 'income')) AS total_income, " +
            "(select ifnull(sum(amount), 0) from transaction where wallet_id=w.id AND category_id in (select id from category where wallet_id=w.id and type = 'expense')) AS total_expense, " +
            "(select starting_amount + total_income - total_expense) as total " +
            "from wallet w where id in (select id from wallet where user_id = ?)";
        let results = await store.personalizedQuery(query, [userId]);
        return results.map(wallet => {
            return {
                id: wallet.id,
                name: wallet.name,
                startingAmount: utils.roundDecimals(wallet.starting_amount),
                totalIncome: utils.roundDecimals(wallet.total_income),
                totalExpense: utils.roundDecimals(wallet.total_expense),
                total: utils.roundDecimals(wallet.total),
            }
        });
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

    return{
        getWallets,
        saveWallet,
    };
};
