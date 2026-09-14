// Máximo a imprimir por array del response en el log
// Usa 0 para imprimir todos los elementos del array
let maxArrayItems = 5;

// Campos que se ocultan con *** en el log
const hiddenFields = new Set([
    'password', 'oldpassword', 'newpassword', 'confirmpassword',
    'token', 'accesstoken', 'refreshtoken', 'authorization', 'cookie', 'setcookie',
    'recoveryphrase', 'passwordhash', 'secret', 'jwtsecret',
    'amount', 'exactamount', 'startingamount', 'totalincome', 'totalexpense',
    'income', 'expense', 'expenses', 'savings', 'total', 'totalvalue',
    'balance', 'currentbalance', 'runningbalance', 'signedamount',
    'totalamount', 'totalportfolio', 'currentvalueusd', 'netflow', 'detail',
]);

function redact(value, seen = new WeakSet(), truncatedArrays = null, fieldPath = '') {
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    const copy = Array.isArray(value) ? [] : {};
    const isArray = Array.isArray(value);
    const truncate = isArray && truncatedArrays && Number.isInteger(maxArrayItems) && maxArrayItems > 0 && value.length > maxArrayItems;
    if (truncate) truncatedArrays.push({ field: fieldPath || '$', totalItems: value.length, omittedItems: value.length - maxArrayItems });
    // Recorrer únicamente la muestra, sin copiar ni redactar los elementos omitidos.
    for (const [key, field] of Object.entries(truncate ? value.slice(0, maxArrayItems) : value)) {
        const normalized = key.replace(/[_-]/g, '').toLowerCase();
        const childPath = isArray ? `${fieldPath}[${key}]` : (fieldPath ? `${fieldPath}.${key}` : key);
        Object.defineProperty(copy, key, { value: hiddenFields.has(normalized) ? '***' : redact(field, seen, truncatedArrays, childPath), enumerable: true });
    }
    seen.delete(value);
    return copy;
}

function formatResponse(value) {
    const truncatedArrays = [];
    const copy = redact(value, new WeakSet(), truncatedArrays);
    if (copy && !Array.isArray(copy) && typeof copy === 'object') {
        // La API usa un sobre { status, error, body }; los metadatos son solo del log.
        return { ...copy, logMetadata: { ...copy.logMetadata,
            ...(truncatedArrays.length ? { truncatedArrays } : {}) } };
    }
    return copy;
}

function errorDetails(error) {
    const code = typeof error?.code === 'string'
        ? error.code : undefined;
    return { type: error instanceof TypeError ? 'TypeError' : 'Error', ...(code !== undefined ? { code } : {}) };
}

function writeRequest({ method, route, ip, status, durationMs, aborted, error, reference, request, response }) {
    const level = aborted || status >= 400 ? (status >= 500 ? 'error' : 'warn') : 'info';
    const entry = { time: new Date().toISOString(), level, event: 'http_request',
        method, route, ip, httpStatus: status, durationMs, aborted,
        request: redact(request), response: redact(response) };
    if (error) entry.error = errorDetails(error);
    if (reference) entry.reference = reference;
    const output = level === 'error' ? console.error : console.log;
    output(JSON.stringify(entry));
}

function writeError(event, error, { symbol } = {}) {
    const safeSymbol = typeof symbol === 'string' && /^[A-Z0-9]{1,10}$/.test(symbol);
    console.error(JSON.stringify({ time: new Date().toISOString(), level: 'error', event,
        ...(safeSymbol ? { symbol } : {}),
        error: errorDetails(error) }));
}

module.exports = { writeRequest, writeError, redact, formatResponse };
