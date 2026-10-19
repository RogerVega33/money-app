const { promisify } = require('node:util');

async function changePasswordAndRevokeSessions(pool, userId, passwordHash, previousHash) {
    const connection = await promisify(pool.getConnection).call(pool);
    const query = promisify(connection.query).bind(connection);
    try {
        await promisify(connection.beginTransaction).call(connection);
        const result = await query('UPDATE user SET password = ? WHERE id = ? AND password = ?',
            [passwordHash, userId, previousHash]);
        if (!result.affectedRows) {
            await promisify(connection.rollback).call(connection);
            return false;
        }
        await query('DELETE FROM auth_session WHERE user_id = ?', [userId]);
        await promisify(connection.commit).call(connection);
        return true;
    } catch (error) {
        await promisify(connection.rollback).call(connection);
        throw error;
    } finally {
        connection.release();
    }
}

async function recoverPasswordAndRevokeSessions(pool, userId, passwordHash, previousPasswordHash,
    recoveryPhraseHash, previousRecoveryPhraseHash) {
    const connection = await promisify(pool.getConnection).call(pool);
    const query = promisify(connection.query).bind(connection);
    try {
        await promisify(connection.beginTransaction).call(connection);
        const result = await query(`UPDATE user SET password = ?, recovery_phrase = ?
            WHERE id = ? AND password = ? AND recovery_phrase = ?`,
        [passwordHash, recoveryPhraseHash, userId, previousPasswordHash, previousRecoveryPhraseHash]);
        if (!result.affectedRows) {
            await promisify(connection.rollback).call(connection);
            return false;
        }
        await query('DELETE FROM auth_session WHERE user_id = ?', [userId]);
        await promisify(connection.commit).call(connection);
        return true;
    } catch (error) {
        await promisify(connection.rollback).call(connection);
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = { changePasswordAndRevokeSessions, recoverPasswordAndRevokeSessions };
