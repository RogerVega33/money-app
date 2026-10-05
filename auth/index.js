const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const { EventEmitter } = require('node:events');
const config = require('../config');
const constants = require('../utils/constants');
const error = require('../utils/errors');
const { clientContext } = require('./clientContext');

function sessionRevoked() {
    return Object.assign(error('La sesión ya no es válida. Inicia sesión nuevamente.', constants.http.forbidden, false),
        { code: 'SESSION_REVOKED' });
}

function decodedToken(req, ignoreExpiration = false) {
    const authorization = req.headers.authorization || '';
    if (!authorization.startsWith('Bearer ')) {
        throw error('Error en el token de autenticación', constants.http.unauthorized, false);
    }
    try {
        const user = jwt.verify(authorization.slice(7), config.jwt.secret, {
            algorithms: ['HS256'], ignoreExpiration,
        });
        if (!Number.isSafeInteger(user.id) || user.id <= 0 ||
            typeof user.sid !== 'string' || !user.sid ||
            !Number.isFinite(user.iat) || !Number.isFinite(user.exp)) throw new Error('Invalid session');
        return user;
    } catch {
        throw error('Forbidden', constants.http.forbidden, false);
    }
}

function sign(data) {
    return jwt.sign(data, config.jwt.secret, {
        expiresIn: config.jwt.sessionDays * 86400, algorithm: 'HS256',
    });
}

function createAuth(injectedStore) {
    // Las pruebas inyectan un almacén simulado; MySQL se carga solo al usar el servicio real.
    const store = () => injectedStore || require('../store/mysql');
    const events = new EventEmitter();

    async function createSession(data, req, passwordHash) {
        const context = clientContext(req);
        if (!context.browser || !context.os) {
            throw error('No se pudo identificar el navegador y el sistema operativo.', constants.http.bad_request, false);
        }
        const token = sign({ ...data, sid: randomUUID() });
        const claims = jwt.decode(token);
        await store().personalizedQuery('DELETE FROM auth_session WHERE expires_at <= UNIX_TIMESTAMP()', []);
        // La contraseña debe seguir siendo la comprobada durante login. INSERT
        // SELECT se serializa con la actualización de esa fila de user.
        const result = await store().personalizedQuery(
            `INSERT INTO auth_session (sid, user_id, initial_ip, last_ip, browser, os, created_at, expires_at)
             SELECT ?, id, ?, ?, ?, ?, ?, ? FROM user WHERE id = ? AND password = ?`,
            [claims.sid, context.ip, context.ip, context.browser, context.os, claims.iat, claims.exp, data.id, passwordHash]);
        if (!result.affectedRows) throw error('Las credenciales cambiaron. Inicia sesión nuevamente.', constants.http.unauthorized, false);
        return token;
    }

    async function revoke(user) {
        await store().personalizedQuery('DELETE FROM auth_session WHERE sid = ? AND user_id = ?', [user.sid, user.id]);
        events.emit('revoked', { sid: user.sid });
    }

    async function validateSession(user, req) {
        const rows = await store().personalizedQuery(
            'SELECT browser, os, last_ip FROM auth_session WHERE sid = ? AND user_id = ? AND expires_at > UNIX_TIMESTAMP()',
            [user.sid, user.id]);
        const session = rows[0];
        if (!session) throw sessionRevoked();
        const context = clientContext(req);
        if (session.browser !== context.browser || session.os !== context.os) {
            await revoke(user);
            throw sessionRevoked();
        }
        // Cambiar de red solo actualiza el seguimiento; no modifica la identidad.
        if (session.last_ip !== context.ip) {
            const result = await store().personalizedQuery(
                'UPDATE auth_session SET last_ip = ? WHERE sid = ? AND user_id = ? AND expires_at > UNIX_TIMESTAMP()',
                [context.ip, user.sid, user.id]);
            if (!result.affectedRows) throw sessionRevoked();
        }
    }

    async function checkUser(req) {
        const user = decodedToken(req);
        await validateSession(user, req);
        return user;
    }

    async function renew(user) {
        if (Date.now() / 1000 - user.iat < 3600) return null;
        const { iat, exp, ...data } = user;
        const token = sign(data);
        const result = await store().personalizedQuery(
            `UPDATE auth_session SET expires_at = GREATEST(expires_at, ?)
             WHERE sid = ? AND user_id = ? AND expires_at > UNIX_TIMESTAMP()`,
            [jwt.decode(token).exp, user.sid, user.id]);
        if (!result.affectedRows) throw sessionRevoked();
        return token;
    }

    async function logout(req) {
        // Un token vencido, pero firmado, también puede cerrar su sesión:
        // alguna copia renovada podría seguir activa con el mismo sid.
        await revoke(decodedToken(req, true));
    }

    function userSessionsRevoked(userId) {
        events.emit('revoked', { userId });
    }

    return { createSession, check: { user: checkUser }, validateSession, renew, logout, userSessionsRevoked, events };
}

module.exports = { ...createAuth(), createAuth };
