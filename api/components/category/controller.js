const validate = require('../../../utils/dataValidation');
const TABLE = 'category';
const error = require('../../../utils/errors');
const constants = require('../../../utils/constants');

module.exports = function(injectedStore) {
    let store = injectedStore;
    if(!store){
        store = require('../../../store/mysql');
    }

    async function getCategories(userId, walletId){
        walletId = validate.integer(walletId, 'La billetera');
        let query = "select c.* from category c, wallet w " +
            " where c.wallet_id = w.id and w.user_id = ? and w.id = ? order by c.name";
        let results = await store.personalizedQuery(query, [userId, walletId]);
        return results.map(category => {
            return {
                id: category.id,
                name: category.name,
                type: category.type,
                walletId: category.wallet_id,
            }
        });
    }

    async function saveCategory(userId, category){
        category = validate.category(category);
        // Actualizar
        if(category.id) {
            let query = "select c.* from category c, wallet w " +
                " where c.wallet_id = w.id and w.user_id = ? and c.id = ?";
            let results = await store.personalizedQuery(query, [userId, category.id]);
            if(results[0]){
                return store.update(TABLE, {name: category.name}, {id: category.id});
            }
            return null;
        }
        // Verifica la pertenencia de la billetera de destino.
        const wallet = await store.query('wallet', {id: category.walletId}, {user_id: userId});
        if (!wallet[0]) throw error('Not found', constants.http.not_found, false);

        // Nuevo registro - verifica que no haya duplicados
        let query = "select c.* from category c, wallet w " +
            " where c.wallet_id = w.id and w.user_id = ? and c.type = ? and c.name = ? and w.id = ?";
        let results = await store.personalizedQuery(query, [userId, category.type, category.name, category.walletId]);

        if(results[0]) return null;

        return store.insert(TABLE, {
            name: category.name,
            type: category.type,
            wallet_id: category.walletId
        });
    }

    return{
        getCategories,
        saveCategory
    };
};
