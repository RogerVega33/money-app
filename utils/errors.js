function err(message, code, logged = true){
    let e = new Error(message);
    e.logged = logged;
    // Solo los errores esperados creados por la aplicación exponen su mensaje
    e.expose = Number.isInteger(code) && code >= 400 && code < 500;
    if(code) e.statusCode = code;
    return e;
}

module.exports = err;