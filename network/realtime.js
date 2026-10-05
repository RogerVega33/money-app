const { Server } = require('socket.io');
const auth = require('../auth');
const { buildCorsOptions } = require('./corsMiddleware');
const { priceEvents } = require('../api/components/wallet/cryptoPriceService');
const proxyaddr = require('proxy-addr');

function attachRealtime(server, trustProxy = () => false, authService = auth) {
    const cors = buildCorsOptions();
    const io = new Server(server, {
        path: '/api/socket.io',
        cors,
        // CORS por sí solo no protege el transporte WebSocket.
        allowRequest: (req, callback) => {
            cors.origin(req.headers.origin, (err, allowed) => callback(null, !err && allowed));
        },
    });
    function request(socket) {
        return {
            headers: { ...socket.request.headers, authorization: `Bearer ${socket.handshake.auth.token}` },
            ip: proxyaddr(socket.request, trustProxy),
        };
    }
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (typeof token !== 'string') throw new Error('Unauthorized');
            const user = await authService.check.user(request(socket));
            socket.data.user = user;
            next();
        } catch (cause) {
            const error = new Error('Unauthorized');
            if (cause.code === 'SESSION_REVOKED') error.data = { code: cause.code };
            next(error);
        }
    });
    io.on('connection', async (socket) => {
        const user = socket.data.user;
        socket.join(`session:${user.sid}`);
        let expiry;
        function scheduleExpiry() {
            const remaining = user.exp * 1000 - Date.now();
            if (remaining <= 0) return socket.disconnect(true);
            // Node limita setTimeout a unos 24,8 días; una sesión de 30 días
            // necesita programar el resto (5.2) al alcanzar ese límite.
            expiry = setTimeout(scheduleExpiry, Math.min(remaining, 2147483647));
            expiry.unref();
        }
        socket.on('disconnect', () => clearTimeout(expiry));
        try {
            // Cubrir un logout ocurrido entre la autenticación y la conexión.
            await authService.validateSession(user, request(socket));
            if (!socket.connected) return;
            socket.join(`user:${user.id}`);
            scheduleExpiry();
        } catch (error) {
            if (error.code === 'SESSION_REVOKED') socket.emit('session:revoked');
            socket.disconnect(true);
        }
    });
    const onRevoked = ({ sid, userId }) => {
        const room = sid ? `session:${sid}` : `user:${userId}`;
        io.to(room).emit('session:revoked');
        io.in(room).disconnectSockets(true);
    };
    authService.events.on('revoked', onRevoked);
    const onPriceUpdated = userId => {
        io.to(`user:${userId}`).emit('crypto:pricesUpdated');
    };
    priceEvents.on('updated', onPriceUpdated);
    server.once('close', () => {
        priceEvents.off('updated', onPriceUpdated);
        authService.events.off('revoked', onRevoked);
    });
    return io;
}

// Las rutas llaman esto únicamente después de que la escritura haya terminado.
// Invalidar por usuario cubre también movimientos entre dos billeteras.
function transactionsChanged(req) {
    req.app.get('realtime')?.to(`user:${req.userId}`).emit('transactions:changed');
}

module.exports = { attachRealtime, transactionsChanged };
