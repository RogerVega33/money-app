const auth = require('../auth');

module.exports = function checkAuth(){
    function middleware(req, res, next) {
        const user = auth.check.user(req);
        req.userId = user.id;
        req.username = user.username;
        next();
    }
    return middleware;
};