const logger = require('./logger');

function log(req, res, next) {
    const started = process.hrtime.bigint();
    const ip = req.ip || req.socket?.remoteAddress || null;
    // No incluir query strings; las rutas de esta API son estáticas.
    const path = (req.originalUrl || req.url || '').split('?')[0];
    let logged = false;
    let responseBody = null;
    let captured = false;
    const send = res.send;
    res.send = function(body) {
        // Express vuelve a llamar send con el JSON serializado: capturar solo una vez.
        if (!captured) {
            captured = true;
            responseBody = body && typeof body === 'object' && !Buffer.isBuffer(body)
                ? logger.redact(body) : '[Respuesta no JSON: contenido omitido]';
        }
        return send.call(this, body);
    };
    function complete(aborted) {
        if (logged) return;
        logged = true;
        logger.writeRequest({
            method: req.method,
            route: req.route ? path : `${path} [unmatched]`,
            ip,
            status: aborted ? null : res.statusCode,
            durationMs: Math.round(Number(process.hrtime.bigint() - started) / 1e6 * 100) / 100,
            aborted,
            error: res.locals.logError,
            request: { query: req.query || {}, body: req.body || {} },
            response: responseBody,
        });
    }
    res.once('finish', () => complete(false));
    res.once('close', () => complete(!res.writableFinished));
    next();
}

module.exports = log;
