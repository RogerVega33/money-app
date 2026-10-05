const Bowser = require('bowser');
const ipaddr = require('ipaddr.js');

function clientContext(req) {
    const agent = req.headers['user-agent'];
    const parsed = typeof agent === 'string' && agent ? Bowser.getParser(agent) : null;
    return {
        ip: ipaddr.process(req.ip || req.socket.remoteAddress).toString(),
        browser: parsed?.getBrowserName() || '',
        os: parsed?.getOSName() || '',
    };
}

module.exports = { clientContext };
