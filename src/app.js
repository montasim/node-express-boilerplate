import express from 'express';
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';

import config from './config/config.js';
import Morgan from './config/morgan.js';
import { jwtStrategy } from './config/passport.js';
import { authLimiter } from './middlewares/rateLimiter.js';
import appRoute from './modules/app/app.route.js';

import { errorConverter, errorHandler } from './middlewares/error.js';

const app = express();

if (config.env !== 'test') {
    app.use(Morgan.successHandler);
    app.use(Morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
    app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/', appRoute);

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
