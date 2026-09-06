const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || Buffer.byteLength(jwtSecret.trim(), 'utf8') < 32) {
    throw new Error('JWT_SECRET es obligatorio y debe tener al menos 32 bytes. Genera un secreto aleatorio y configúralo en el entorno antes de iniciar el backend.');
}

module.exports = {
    api: {
        port: process.env.API_PORT || 3000,
        env: process.env.API_ENV || 'dev',
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
    },
    crypto: {
        cacheMinutes: process.env.CRYPTO_CACHE_MINUTES || 5,
    }
};
