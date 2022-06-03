function err(message, code, logged = true){
    let e = new Error(message);
    e.logged = logged;
    if(code) e.statusCode = code;
    return e;
}

module.exports = err;