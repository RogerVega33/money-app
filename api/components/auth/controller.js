const auth = require('../../../auth');
const bcrypt = require('bcryptjs');
const utils = require('../../../utils/utils');
const TABLE = 'user';

module.exports = function(injectedStore) {
    let store = injectedStore;
    if(!store){
        store = require('../../../store/mysql');
    }

    async function login(username, password){
        const user = await store.query(TABLE, {email: username});
        if(!user.length) throw new Error("Información incorrecta");
        return bcrypt.compare(password, user[0].password)
            .then(result => {
                if(result === true){
                    let response = {
                        id: user[0].id,
                        name: user[0].name,
                        email: user[0].email,
                        lastLogin: user[0].last_login,
                        loginAttemps: user[0].login_attempts
                    };
                    let jwt = auth.sign(response);
                    store.update(TABLE, {last_login: new Date(), login_attempts: 0}, {id: user[0].id});
                    return {...response, token: jwt};
                }else{
                    //Se actualiza intentos de login
                    if(user[0])
                        store.update(TABLE, {login_attempts: user[0].login_attempts+1}, {id: user[0].id});
                    throw new Error("Información incorrecta");
                }
            });
    }

    async function changePassword(email, oldPassword, newPassword){
        const user = await store.query(TABLE, {email: email});
        let newPasswordHash = await utils.getHash(newPassword);
        return bcrypt.compare(oldPassword, user[0].password)
            .then(result => {
                if(result === true){
                    store.update(TABLE, {password: newPasswordHash}, {id: user[0].id});
                    return {
                        message:'Contraseña actualizada correctamente'
                    };
                }
                throw new Error();
            });
    }

    async function getHash(text){
        let hash = await utils.getHash(text);
        return {hash}
    }

    return{
        login,
        changePassword,
        getHash,
    }

};
