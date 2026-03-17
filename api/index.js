const express = require('express');
//const swaggerUi = require('swagger-ui-express');
const config = require('../config.js');
const compression = require('compression');
const loggerInterceptor = require('../network/loggerInterceptor');
const errors = require('../network/errors');
const errorsNotDefined = require('../network/errorsNotDefined');
//const swaggerDoc = require('../swagger.json');
const corsMiddleware = require('../network/corsMiddleware');

const wallet = require('./components/wallet/router');
const category = require('./components/category/router');
const transaction = require('./components/transaction/router');
const auth = require('./components/auth/router');

const app = express();
app.use(compression());

//CORS
app.use(corsMiddleware());
app.options('*', corsMiddleware());

app.use(express.json());
app.use(loggerInterceptor);

//ROUTES
app.use('/api/auth', auth);
app.use('/api/wallet', wallet);
app.use('/api/category', category);
app.use('/api/transaction', transaction);

//ERROR HANDLING
app.use(errors);
app.use(errorsNotDefined);

app.listen(config.api.port, () => {
   console.log('listening on Server port ', config.api.port);
});
