const cors = require('cors');
const error = require('../utils/errors');
const config = require('../config');

function buildCorsOptions() {
    const isDev = config.api.env === 'dev';

    const whitelist = (process.env.CORS_ORIGIN || '')
        .split(',')
        .map(o => o.trim().replace(/\/$/, ''))
        .filter(Boolean);

    return {
        origin: (origin, callback) => {
            if (isDev) return callback(null, true);

            if (!origin || whitelist.includes(origin)) {
                return callback(null, true);
            }

            return callback(error('Forbidden', 403, false));
        },
        credentials: true,
        exposedHeaders: ['Retry-After'],
    };
}

function corsMiddleware() {
    const options = buildCorsOptions();
    return cors(options);
}

module.exports = corsMiddleware;
module.exports.buildCorsOptions = buildCorsOptions;
