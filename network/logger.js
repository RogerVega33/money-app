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
    let log = `[${getCurrentTime()}] [response]:${JSON.stringify(res)}`;
    log = replaceSensitiveInformation(log);
    console.log(log);
    writeLog(log);
}

function writeRequest(req, res){
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || null;
    let log = `[${getCurrentTime()}] [ip]:${ip} [method]:${req.method}:${req.url} [status]:${res.statusCode} [user-agent]:${req.headers['user-agent']} [accept-encoding]:${req.headers['accept-encoding']} [content-type]:${req.headers['content-type']} [request]:${JSON.stringify(req.body)}`;
    log = replaceSensitiveInformation(log);
    console.log(log);
    writeLog(log);
}

function replaceSensitiveInformation(log){
    let regex = /"password" *: *".*"/;
    log = log.replace(regex, '"password": "*****"');
    regex = /"token" *: *".*"/;
    log = log.replace(regex, '"token": "*****"');
    regex = /"oldPassword" *: *".*"/;
    log = log.replace(regex, '"oldPassword": "*****"');
    regex = /"newPassword" *: *".*"/;
    log = log.replace(regex, '"newPassword": "*****"');
    return log;
}

module.exports = {
    writeRequest,
    writeResponse
};