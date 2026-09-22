const auth = require('../../../auth');
const bcrypt = require('bcryptjs');
const utils = require('../../../utils/utils');
const error = require("../../../utils/errors");
const constants = require("../../../utils/constants");
const { validatePassword, validateUserCredentials } = require('../../../utils/userValidator')

const TABLE = 'user';
const {
    generateRecoveryPhrase,
    hashRecoveryPhrase,
    verifyRecoveryPhrase
} = require('../../../auth/recoveryPhrase');

const RECOVERY_PHRASE_WORDS = 8;

function authenticationFailure() {
    return Object.assign(error('Información incorrecta', constants.http.bad_request, false), { authenticationFailed: true });
}

module.exports = function(injectedStore) {
    let store = injectedStore;
    if(!store){
        store = require('../../../store/mysql');
    }

    async function createUser(username, password){
        const { hasErrors, message } = validateUserCredentials(username, password)
        if (hasErrors)
            throw error(message, constants.http.bad_request, false)

        // Valida que el usuario no exista
        const userExist = await store.query(TABLE, { username: username });
        if (userExist[0]) throw error('Usuario ya existe', constants.http.conflict, false);

        const passwordHash = await utils.getHash(password);

        const recoveryPhrase = generateRecoveryPhrase(RECOVERY_PHRASE_WORDS);
        const recoveryPhraseHash = await hashRecoveryPhrase(recoveryPhrase);

        try {
            await store.insert(TABLE, { username: username, name: username, password: passwordHash, recovery_phrase: recoveryPhraseHash });
        } catch (cause) {
            if (cause.code === 'ER_DUP_ENTRY') throw error('Usuario ya existe', constants.http.conflict, false);
            throw cause;
        }

        const user = await store.query(TABLE, { username: username });
        if(user[0]) {
            const response = {
                id: user[0].id,
                name: user[0].name,
                username: user[0].username,
                lastLogin: user[0].last_login,
                loginAttemps: user[0].login_attempts
            };
            return { ...response, recoveryPhrase };
        }
        throw error('Ocurrió un error al crear el usuario', constants.http.not_found, false);
    }

    async function recoverUser(body){
        if (!body.username || !body.newPassword || !body.recoveryPhrase)
            throw error('Bad request', constants.http.bad_request, false);

        const passwordErrors = validatePassword(body.newPassword)
        if (passwordErrors.length > 0)
            throw error(passwordErrors.join(' '), constants.http.bad_request, false)

        // Valida que el usuario exista
        const user = await store.query(TABLE, { username: body.username });
        const valid = user[0]?.recovery_phrase && typeof body.recoveryPhrase === 'string' &&
            await verifyRecoveryPhrase(body.recoveryPhrase, user[0].recovery_phrase);

        if(!valid) throw authenticationFailure();

        const newPasswordHash = await utils.getHash(body.newPassword);
        await store.update(TABLE, { password: newPasswordHash }, { id: user[0].id });

        return { message: 'Contraseña actualizada correctamente' };
    }

    async function login(username, password) {
        if (typeof password !== 'string' || !password) throw authenticationFailure();
        const user = await store.query(TABLE, { username: username });
        if (!user.length) throw authenticationFailure();

        const match = await bcrypt.compare(password, user[0].password);

        if (!match) {
            await store.update(TABLE, { login_attempts: user[0].login_attempts + 1 }, { id: user[0].id });
            throw authenticationFailure();
        }

        const response = {
            id: user[0].id,
            name: user[0].name,
            username: user[0].username,
            lastLogin: user[0].last_login,
            loginAttemps: user[0].login_attempts
        };

        await store.update(TABLE, { last_login: new Date(), login_attempts: 0 }, { id: user[0].id });

        return { ...response, token: auth.sign(response) };
    }

    async function changePassword(username, oldPassword, newPassword) {
        const passwordErrors = validatePassword(newPassword)
        if (passwordErrors.length > 0)
            throw error(passwordErrors.join(' '), constants.http.bad_request, false)

        const user = await store.query(TABLE, { username });
        if (!user.length || typeof oldPassword !== 'string' || !oldPassword) throw authenticationFailure();

        const match = await bcrypt.compare(oldPassword, user[0].password);
        if (!match) throw authenticationFailure();

        const newPasswordHash = await utils.getHash(newPassword);
        await store.update(TABLE, { password: newPasswordHash }, { id: user[0].id });

        return { message: 'Contraseña actualizada correctamente' };
    }

    async function getHash(text){
        let hash = await utils.getHash(text);
        return {hash}
    }

    return{
        login,
        changePassword,
        getHash,
        createUser,
        recoverUser,
    }

};
