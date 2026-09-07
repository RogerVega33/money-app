require('dotenv').config();

const express = require('express');
//const swaggerUi = require('swagger-ui-express');
const config = require('../config.js');
const compression = require('compression');
const loggerInterceptor = require('../network/loggerInterceptor');
const errors = require('../network/errors');
const errorsNotDefined = require('../network/errorsNotDefined');
//const swaggerDoc = require('../swagger.json');
const helmet = require('helmet');
const corsMiddleware = require('../network/corsMiddleware');

const wallet = require('./components/wallet/router');
const category = require('./components/category/router');
const transaction = require('./components/transaction/router');
const auth = require('./components/auth/router');

const app = express();
app.set('trust proxy', config.api.trustProxy);

app.use(helmet({
   contentSecurityPolicy: false,
}));

//CORS
app.use(corsMiddleware());
app.options('*', corsMiddleware());

app.use(compression());
app.use(express.json());
app.use(loggerInterceptor);

// TEMPORAL: simular una conexión lenta para probar los estados de carga.
// Eliminar este middleware al terminar las pruebas.
/*
app.use('/api', (req, res, next) => {
   setTimeout(next, 4000);
});
*/

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
