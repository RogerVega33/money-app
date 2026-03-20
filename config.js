module.exports = {
    api: {
        port: process.env.API_PORT || 3000,
        env: process.env.API_ENV || 'dev',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'JWT SECRET',
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