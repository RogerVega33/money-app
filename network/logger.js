const hiddenFields = new Set([
    'password', 'oldpassword', 'newpassword', 'confirmpassword',
    'token', 'accesstoken', 'refreshtoken', 'authorization', 'cookie', 'setcookie',
    'recoveryphrase', 'passwordhash', 'secret', 'jwtsecret',
    'amount', 'exactamount', 'startingamount', 'totalincome', 'totalexpense',
    'income', 'expense', 'expenses', 'savings', 'total', 'totalvalue',
    'balance', 'currentbalance', 'runningbalance', 'signedamount',
    'totalamount', 'totalportfolio', 'currentvalueusd', 'netflow', 'detail',
]);

function redact(value, seen = new WeakSet()) {
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    const copy = Array.isArray(value) ? [] : {};
    for (const [key, field] of Object.entries(value)) {
        const normalized = key.replace(/[_-]/g, '').toLowerCase();
        Object.defineProperty(copy, key, { value: hiddenFields.has(normalized) ? '***' : redact(field, seen), enumerable: true });
    }
    seen.delete(value);
    return copy;
}

function errorDetails(error) {
    const code = typeof error?.code === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code)
        ? error.code : undefined;
    return { type: error instanceof TypeError ? 'TypeError' : 'Error', ...(code ? { code } : {}) };
}

function writeRequest({ method, route, ip, status, durationMs, aborted, error, request, response }) {
    const level = aborted || status >= 400 ? (status >= 500 ? 'error' : 'warn') : 'info';
    const entry = { time: new Date().toISOString(), level, event: 'http_request',
        method, route, ip, status, durationMs, aborted,
        request: redact(request), response: redact(response) };
    if (error) entry.error = errorDetails(error);
    const output = level === 'error' ? console.error : console.log;
    output(JSON.stringify(entry));
}

function writeError(event, error) {
    console.error(JSON.stringify({ time: new Date().toISOString(), level: 'error', event,
        error: errorDetails(error) }));
}

module.exports = { writeRequest, writeError, redact };
