const axios = require("axios");
const logger = require('../../../network/logger');
const config = require('../../../config.js');

const cachedTime = config.crypto.cacheMinutes  * 60 * 1000;

const { EventEmitter } = require('node:events');
const priceEvents = new EventEmitter();
const services = new WeakMap();

module.exports = function(store) {
    if (services.has(store)) return services.get(store);
    const inFlight = new Map();
    const failedSymbols = new Set();
    const batches = new Map();

    async function refreshStalePrices(symbolList, userId) {
        if (!symbolList?.length) return;
        const symbols = [...new Set(symbolList)];
        const placeholders = symbols.map(() => '?').join(', ');
        const cached = await store.personalizedQuery(
            `SELECT symbol, updated_at FROM crypto WHERE symbol IN (${placeholders})`, symbols
        );
        const lastUpdated = new Map(cached.map(row => [row.symbol, row.updated_at]));
        const pending = new Set();
        for (const symbol of symbols) {
            if (inFlight.has(symbol)) {
                pending.add(inFlight.get(symbol));
                continue;
            }
            const date = lastUpdated.get(symbol);
            if (date && Date.now() - new Date(date).getTime() <= cachedTime) {
                console.log(`Precio de ${symbol} en caché`);
                continue;
            }
            // No esperar a Binance en la petición HTTP. Compartir trabajo entre controladores.
            const work = Promise.resolve().then(() => updateCryptoPrice(symbol)).then(success => {
                if (success) failedSymbols.delete(symbol);
                else failedSymbols.add(symbol);
            }).catch(err => {
                logger.writeError('crypto_price_background_error', err, { symbol });
            }).finally(() => inFlight.delete(symbol));
            inFlight.set(symbol, work);
            pending.add(work);
        }
        if (!pending.size) return;
        // Agrupar también las peticiones simultáneas de billeteras y holdings del usuario.
        let batch = batches.get(userId);
        if (!batch) {
            batch = new Set();
            batches.set(userId, batch);
        }
        for (const work of pending) {
            if (batch.has(work)) continue;
            batch.add(work);
            work.then(() => {
                batch.delete(work);
                if (batch.size) return;
                batches.delete(userId);
                // Termina también si hubo fallos, para mantener el estado gris existente.
                priceEvents.emit('updated', userId);
            }).catch(err => logger.writeError('crypto_price_notification_error', err));
        }
    }

    async function updateCryptoPrice(symbol) {
        let price;
        let now = new Date();

        try {
            if (symbol === "USDT" || symbol === "USDC") {
                price = 1.0;
            } else {
                console.log(`Consultando el valor de ${symbol}...`)
                const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`;
                const response = await axios.get(url, { timeout: 5000 });
                price = parseFloat(response.data.price);
            }
            console.log(`Precio de ${symbol}: ${price} USDT`)
            const query = `INSERT INTO crypto (symbol, price, updated_at) VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE price = ?, updated_at = ?`;
            await store.personalizedQuery(query, [symbol, price, now, price, now]);
            return true;
        } catch (err) {
            logger.writeError('crypto_price_refresh_error', err, { symbol });
            return false;
        }
    }

    const service = { refreshStalePrices, failedSymbols };
    services.set(store, service);
    return service;
}

module.exports.priceEvents = priceEvents;
