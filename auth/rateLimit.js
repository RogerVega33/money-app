const { createHash } = require('node:crypto');

// Fixed windows; in-flight attempts reserve a slot before expensive work starts.
// No eviction of live entries: a full store temporarily rejects new keys.
function createWindowStore({ windowMs, maxEntries, now }) {
    const entries = new Map();
    function prune() {
        const time = now();
        for (const [key, entry] of entries) if (entry.expires <= time) entries.delete(key);
    }
    function acquire(key, limit) {
        let entry = entries.get(key);
        if (entry && entry.expires <= now()) {
            entries.delete(key);
            entry = undefined;
        }
        if (!entry) {
            if (entries.size >= maxEntries) prune();
            if (entries.size >= maxEntries) {
                let earliest = Infinity;
                for (const value of entries.values()) earliest = Math.min(earliest, value.expires);
                return { retryAfter: Math.max(1, Math.ceil((earliest - now()) / 1000)) };
            }
            entry = { count: 0, pending: 0, expires: now() + windowMs };
            entries.set(key, entry);
        }
        if (entry.count + entry.pending >= limit) {
            return { retryAfter: Math.max(1, Math.ceil((entry.expires - now()) / 1000)) };
        }
        entry.pending++;
        let settled = false;
        return { finish(outcome) {
            if (settled) return;
            settled = true;
            entry.pending--;
            if (outcome === 'failure') entry.count++;
            if (outcome === 'success') entry.count = 0;
            if (!entry.count && !entry.pending && entries.get(key) === entry) entries.delete(key);
        } };
    }
    return { acquire, prune };
}

function accountKey(username) {
    // Matches case/accent-insensitive usernames without retaining them in memory.
    const normalized = username.trimEnd().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return createHash('sha256').update(normalized).digest('hex');
}

function createAuthRateLimit({ windowMs = 900000, accountMax = 5, ipMax = 100,
    maxEntries = 10000, now = Date.now } = {}) {
    const accounts = createWindowStore({ windowMs, maxEntries, now });
    const ips = createWindowStore({ windowMs, maxEntries, now });
    const timer = setInterval(() => { accounts.prune(); ips.prune(); }, Math.min(windowMs, 60000));
    timer.unref();

    function blocked(res, seconds) {
        res.setHeader('Retry-After', String(seconds));
        return res.status(429).send({ status: 429, error: true, body: {
            message: `Demasiados intentos. Vuelve a intentarlo en ${Math.ceil(seconds / 60)} minuto(s).`,
            retryAfter: seconds,
        } });
    }

    function ip(req, res, next) {
        const ticket = ips.acquire(req.ip || req.socket.remoteAddress, ipMax);
        if (ticket.retryAfter) return blocked(res, ticket.retryAfter);
        ticket.finish('failure'); // Every request counts, including registration and blocked attempts.
        next();
    }

    function account(operation) {
        return (req, res, next) => {
            const username = req.body?.username;
            if (typeof username !== 'string' || !username.trim() || username.length > 50) {
                return res.status(400).send({ status: 400, error: true, body: { message: 'El usuario debe ser texto de entre 1 y 50 caracteres.' } });
            }
            const ticket = accounts.acquire(operation + ':' + accountKey(username), accountMax);
            if (ticket.retryAfter) return blocked(res, ticket.retryAfter);
            // Settle when the controller finishes, even if the client disconnects.
            // Releasing on socket close would allow parallel attempts to evade the limit.
            res.locals.authAttempt = ticket;
            next();
        };
    }
    return { ip, account, close: () => clearInterval(timer) };
}

module.exports = { createAuthRateLimit };
