import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import hpp from 'hpp';
import timeout from 'connect-timeout';
import cors from 'cors';
import passport from 'passport';

import config from './config/config.js';
import Morgan from './config/morgan.js';
import { jwtStrategy } from './config/passport.js';
import authLimiter from './middlewares/rateLimiter.js';
import appRoute from './modules/app/app.route.js';
import corsConfiguration from './middlewares/cors.js';

import { errorConverter, errorHandler } from './middlewares/error.js';
import undefinedService from './modules/undefined/undefined.service.js';

const app = express();

if (config.env !== 'test') {
    app.use(Morgan.successHandler);
    app.use(Morgan.errorHandler);
}

// set security HTTP headers
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                objectSrc: ["'none'"],
                imgSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                upgradeInsecureRequests: [],
            },
        },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
);

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// prevent HTTP parameter pollution
app.use(hpp());

// set timeout
app.use(timeout(`${config.timeout}s`));

// serve static files
app?.use(express?.static('./', { maxAge: config.cache.timeout }));

// enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
app.use(express.json({ limit: config.jsonPayloadLimit }));

// body parser
app.use(express.urlencoded({ limit: config.jsonPayloadLimit, extended: true }));

// enable cors
app.use(cors(corsConfiguration));

app.use(
    session({
        secret: config.jwt.secret, // Use a long, random string here
        resave: false, // Avoids resaving sessions that haven't changed
        saveUninitialized: false, // Don't save a session that is new but hasn't been modified
        cookie: {
            httpOnly: true, // Minimizes risk of client-side script accessing the cookie
            secure: process.env.NODE_ENV === 'production', // Ensures cookies are only used over HTTPS
            sameSite: 'strict', // Strictly restricts cookie sending to same site requests
            maxAge: 24 * 60 * 60 * 1000, // Sets cookie expiry to 24 hours
        },
    })
);

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

if (config.env === 'production') {
    // limit repeated failed requests to auth endpoints
    app.use('/v1/auth', authLimiter);

    // secure apps by setting various HTTP headers
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}

// v1 api routes
app.use('/', appRoute);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    const undefinedData = undefinedService();

    res.status(undefinedData.status).send(undefinedData);

    next();
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
