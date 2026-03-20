const axios = require("axios");
const config = require('../../../config.js');

const cachedTime = config.crypto.cacheMinutes  * 60 * 1000;

module.exports = function(store) {
    async function refreshStalePrices(symbolList) {
        if (!symbolList?.length) return;

        // Consulta la BD para saber cuándo se actualizó cada símbolo
        const placeholders = symbolList.map(() => '?').join(', ');
        const cached = await store.personalizedQuery(
            `SELECT symbol, updated_at FROM crypto WHERE symbol IN (${placeholders})`,
            symbolList
        );

        const lastUpdatedMap = Object.fromEntries(
            cached.map(row => [row.symbol, row.updated_at])
        );

        const now = new Date();

        // Solo llama a Binance por los símbolos desactualizados
        for (const symbol of symbolList) {
            const lastUpdate = lastUpdatedMap[symbol];
            const isStale = !lastUpdate || (now - new Date(lastUpdate)) > cachedTime;

            if (isStale) {
                await updateCryptoPrice(symbol);
            } else {
                console.log(`Precio de ${symbol} en caché`);
            }
        }

    }

    async function updateCryptoPrice(symbol) {
        let price;
        let now = new Date();

        try {
            if (symbol === "USDT" || symbol === "USDC") {
                price = 1.0;
            } else {
                console.log(`Consultando en Binance el valor de ${symbol}`)
                const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`;
                const response = await axios.get(url, { timeout: 5000 });
                price = parseFloat(response.data.price);
            }
            console.log(`Precio de ${symbol}: ${price} USDT`)
            const query = `INSERT INTO crypto (symbol, price, updated_at) VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE price = ?, updated_at = ?`;
            await store.personalizedQuery(query, [symbol, price, now, price, now]);
        } catch (err) {
            console.error(`Error al consultar en Binance el valor de ${symbol}: ${err.message}`);
        }
    }

    return { refreshStalePrices };
}