const { randomUUID } = require('node:crypto');
const response = require('./response');

function errors(err, req, res, next) {
    if (res.headersSent) return next(err);

    // Los errores del parser contienen el cuerpo original: nunca exponer su mensaje
    const parserMessages = {
        'entity.parse.failed': [400, 'El cuerpo de la solicitud debe ser JSON válido.'],
        'entity.too.large': [413, 'La solicitud supera el tamaño permitido.'],
        'charset.unsupported': [415, 'La codificación de la solicitud no es compatible.'],
        'encoding.unsupported': [415, 'La codificación de la solicitud no es compatible.'],
    };
    const parserError = Object.hasOwn(parserMessages, err.type) && parserMessages[err.type];
    if (parserError) return response.error(req, res, parserError[1], parserError[0]);

    if (err.expose === true && Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 500) {
        return response.error(req, res, err.message, err.statusCode);
    }

    res.locals.logError = err;
    res.locals.errorReference = `err-${randomUUID()}`;
    return response.error(req, res, 'No se pudo completar la operación.', 500, res.locals.errorReference);
}

module.exports = errors;
