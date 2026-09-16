const { Server } = require('socket.io');
const auth = require('../auth');
const { buildCorsOptions } = require('./corsMiddleware');
const { priceEvents } = require('../api/components/wallet/cryptoPriceService');

function attachRealtime(server) {
    const cors = buildCorsOptions();
    const io = new Server(server, {
        path: '/api/socket.io',
        cors,
        // CORS por sí solo no protege el transporte WebSocket.
        allowRequest: (req, callback) => {
            cors.origin(req.headers.origin, (err, allowed) => callback(null, !err && allowed));
        },
    });
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (typeof token !== 'string') throw new Error('Unauthorized');
            const user = auth.check.user({ headers: { authorization: `Bearer ${token}` } });
            if (!user.id || !Number.isFinite(user.exp)) throw new Error('Unauthorized');
            socket.data.user = user;
            next();
        } catch {
            next(new Error('Unauthorized'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.data.user;
        socket.join(`user:${user.id}`);
        const expiry = setTimeout(() => socket.disconnect(true), Math.max(0, user.exp * 1000 - Date.now()));
        expiry.unref();
        socket.on('disconnect', () => clearTimeout(expiry));
    });
    const onPriceUpdated = userId => {
        io.to(`user:${userId}`).emit('crypto:pricesUpdated');
    };
    priceEvents.on('updated', onPriceUpdated);
    server.once('close', () => priceEvents.off('updated', onPriceUpdated));
    return io;
}

// Las rutas llaman esto únicamente después de que la escritura haya terminado.
// Invalidar por usuario cubre también movimientos entre dos billeteras.
function transactionsChanged(req) {
    req.app.get('realtime')?.to(`user:${req.userId}`).emit('transactions:changed');
}

module.exports = { attachRealtime, transactionsChanged };
