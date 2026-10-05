const auth = require('../auth');

module.exports = function checkAuth(authService = auth){
    async function middleware(req, res, next) {
        try {
            const user = await authService.check.user(req);
            req.userId = user.id;
            req.username = user.username;
            res.setHeader('Cache-Control', 'no-store');
            const token = await authService.renew(user);
            if (token) res.setHeader('X-Session-Token', token);
            next();
        } catch (error) {
            next(error);
        }
    }
    return middleware;
};
