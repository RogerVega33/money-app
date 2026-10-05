const auth = require('./index');
const response = require('../network/response');
const constants = require('../utils/constants');

module.exports = function logoutHandler(authService = auth) {
    return async (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        try {
            await authService.logout(req);
            response.success(req, res, { message: 'Sesión cerrada correctamente' }, constants.http.ok);
        } catch (error) {
            next(error);
        }
    };
};
