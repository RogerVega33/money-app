const fs = require("fs");
const logsDir = "./logs/";

function getCurrentTime() {
    let current_datetime = new Date();
    return current_datetime.getFullYear() +
        "-" +
        (current_datetime.getMonth() + 1) +
        "-" +
        current_datetime.getDate() +
        " " +
        current_datetime.getHours() +
        ":" +
        current_datetime.getMinutes() +
        ":" +
        current_datetime.getSeconds();
}

function writeLog(log) {
    let current_datetime = new Date();
    let fileName=current_datetime.getFullYear()+"-"+(current_datetime.getMonth()+1)+"-"+current_datetime.getDate()+".log";
    fs.appendFile(logsDir+fileName, log + "\n", err => {
        if (err) {
            console.log(err);
        }
    });
}

function writeResponse(res){
    let log = `[${getCurrentTime()}] [response]:${serializeForLog(res)}`;
    console.log(log);
    writeLog(log);
}

function writeRequest(req, res){
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || null;
    let log = `[${getCurrentTime()}] [ip]:${ip} [method]:${req.method}:${req.url} [status]:${res.statusCode} [user-agent]:${req.headers['user-agent']} [accept-encoding]:${req.headers['accept-encoding']} [content-type]:${req.headers['content-type']} [request]:${serializeForLog(req.body)}`;
    console.log(log);
    writeLog(log);
}

// Normalizar los nombres cubre tanto camelCase como snake_case.
const sensitiveFields = new Set([
    'password',
    'oldpassword',
    'newpassword',
    'confirmpassword',
    'token',
    'accesstoken',
    'refreshtoken',
    'recoveryphrase',
]);

function serializeForLog(value) {
    return JSON.stringify(value, (key, fieldValue) => {
        const normalizedKey = key.replace(/_/g, '').toLowerCase();
        return sensitiveFields.has(normalizedKey) ? '*****' : fieldValue;
    });
}

module.exports = {
    getCurrentTime,
    writeRequest,
    writeResponse
};