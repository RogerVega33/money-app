const constants = require("../utils/constants");

exports.success = function(req, res, body, status) {
    const responseBody = {
        status: status || constants.http.ok,
        error: false,
        body: body || {},
    };
    res.status(status).send(responseBody);
};

exports.successFile = function(req, res, file, status) {
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.status(status).attachment(file.fileName).send(file.file);
};

exports.error = function(req, res, message, status) {
    let statusMessage = {message: message || 'Internal server error'};
    const responseBody = {
        status: status || constants.http.internal_server_error,
        error: true,
        body: statusMessage
    };
    res.status(status).send(responseBody);
};