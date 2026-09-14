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

    async function ensureUniqueName(walletId, type, name, excludedId = 0) {
        const matches = await store.personalizedQuery(
            'SELECT id FROM category WHERE wallet_id = ? AND type = ? AND LOWER(TRIM(name)) = LOWER(?) AND id <> ? LIMIT 1',
            [walletId, type, name, excludedId]
        );
        if (matches.length) throw error('Ya existe una categoría con ese nombre y tipo en esta billetera', constants.http.conflict, false);
    }

    async function saveCategory(userId, category){
        category = validate.category(category);
        // Actualizar
        if(category.id) {
            let query = "select c.*, w.type AS wallet_type from category c, wallet w " +
                " where c.wallet_id = w.id and w.user_id = ? and c.id = ?";
            let results = await store.personalizedQuery(query, [userId, category.id]);
            if(results[0]){
                if (results[0].wallet_type !== 'fiat') throw error('Solo puede agregar categorías en una billetera fiat', constants.http.bad_request, false);
                await ensureUniqueName(results[0].wallet_id, results[0].type, category.name, category.id);
                await store.update(TABLE, {name: category.name}, {id: category.id});
                return { message: 'Operación exitosa' };
            }
            return null;
        }
        // Verifica la pertenencia de la billetera de destino.
        const wallet = await store.query('wallet', {id: category.walletId}, {user_id: userId});
        if (!wallet[0]) throw error('Not found', constants.http.not_found, false);
        if (wallet[0].type !== 'fiat') throw error('Solo puede agregar categorías en una billetera fiat', constants.http.bad_request, false);

        await ensureUniqueName(category.walletId, category.type, category.name);

        await store.insert(TABLE, {
            name: category.name,
            type: category.type,
            wallet_id: category.walletId
        });
        return { message: 'Operación exitosa' };
    }

    return{
        getCategories,
        saveCategory
    };
};
