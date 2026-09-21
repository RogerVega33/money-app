const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || Buffer.byteLength(jwtSecret.trim(), 'utf8') < 32) {
    throw new Error('JWT_SECRET es obligatorio y debe tener al menos 32 bytes. Genera un secreto aleatorio y configúralo en el entorno antes de iniciar el backend.');
}

function positiveInteger(name, fallback) {
    const value = process.env[name] === undefined ? fallback : Number(process.env[name]);
    if (!Number.isSafeInteger(value) || value < 1 || value > 1000000) throw new Error(`${name} debe ser un entero entre 1 y 1000000.`);
    return value;
}

module.exports = {
    api: {
        port: process.env.API_PORT || 3000,
        env: process.env.API_ENV || 'dev',
        trustProxy: process.env.TRUST_PROXY === '1' ? 1 : (process.env.TRUST_PROXY || false),
    },
    authRateLimit: {
        windowMs: positiveInteger('AUTH_WINDOW_SECONDS', 900) * 1000,
        accountMax: positiveInteger('AUTH_ACCOUNT_MAX_FAILURES', 5),
        ipMax: positiveInteger('AUTH_IP_MAX_REQUESTS', 100),
        maxEntries: positiveInteger('AUTH_MAX_ENTRIES', 10000),
    },
    jwt: {
        secret: jwtSecret,
    },
    mysql: {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'user',
        port: process.env.MYSQL_PORT || 3306,
        password: process.env.MYSQL_PASSWORD || 'password',
        database: process.env.MYSQL_DATABASE || 'database',
        connectionLimit: positiveInteger('MYSQL_CONNECTION_LIMIT', 5),
    },
    crypto: {
        cacheMinutes: process.env.CRYPTO_CACHE_MINUTES || 5,
    }
};
