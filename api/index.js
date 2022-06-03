const express = require('express');
//const swaggerUi = require('swagger-ui-express');
const config = require('../config.js');
const compression = require('compression');
const loggerInterceptor = require('../network/loggerInterceptor');
const errors = require('../network/errors');
const errorsNotDefined = require('../network/errorsNotDefined');
//const swaggerDoc = require('../swagger.json');

const wallet = require('./components/wallet/routes');
const transaction = require('./components/transaction/routes');
const auth = require('./components/auth/routes');

const app = express();
app.use(compression());
app.use(express.json());
app.use(loggerInterceptor);

//ROUTES
app.use('/api/wallet', wallet);
app.use('/api/transaction', transaction);
app.use('/api/auth', auth);

//ERROR HANDLING
app.use(errors);
app.use(errorsNotDefined);

app.listen(config.api.port, () => {
   console.log('listening on Server port ', config.api.port);
});
