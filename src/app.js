/**
 * This file configures the Express application and sets up middlewares for security,
 * performance, and flexibility. It includes configurations for CORS, session management,
 * request parsing, compression, and security headers. Additionally, it integrates the
 * application with a logging system, rate limiter, authentication strategies, and global
 * error handling. The setup emphasizes security through the use of Helmet, XSS protection,
 * and Mongo sanitizes to prevent injection attacks. It also uses sessions with MongoDB
 * storage, compression for performance, and sets up a structured routing system for API endpoints.
 *
 * @fileoverview Express application setup and middleware configuration.
 */

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
import httpStatus from 'http-status';

import config from './config/config.js';
import MorganConfig from './config/morgan.config.js';
import helmetConfig from './config/helmet.config.js';
import { jwtStrategy } from './config/passport.config.js';
import authLimiter from './middlewares/rateLimiter.js';
import appRoute from './modules/app/app.route.js';
import corsConfig from './config/cors.config.js';
import sessionConfig from './config/session.config.js';
import loggerConfig from './config/logger.config.js';

import { errorConverter, errorHandler } from './middlewares/error.js';
import undefinedService from './modules/undefined/undefined.service.js';
import errorEmailBody from './utils/errorEmailBody.js';
import EmailService from './modules/email/email.service.js';

const app = express();

/**
 * Configures Morgan logger for HTTP request logging.
 */
if (config.env !== 'test') {
    app.use(MorganConfig.successHandler);
    app.use(MorganConfig.errorHandler);
}

/**
 * Sets up security headers using Helmet, including CSP and referrer policy.
 */
app.use(helmet(helmetConfig));

// parse json request body
app.use(express.json());

// parse URL-encoded request body
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
app.use(cors(corsConfig));

/**
 * Configures session management using MongoDB for session storage.
 */
app.use(session(sessionConfig));

// Initializes Passport and configures JWT strategy for authentication
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

/**
 * Handles requests to undefined routes by sending a 404 error.
 */
app.use((req, res, next) => {
    const undefinedData = undefinedService();

    res.status(undefinedData.status).send(undefinedData);

    next();
});

/**
 * Middleware for handling specific error types and generic error forwarding.
 * This middleware intercepts errors that occur during request processing, allowing
 * for centralized error handling. It checks the error code to identify specific
 * errors, such as a connection refusal indicated by 'ECONNREFUSED', and handles
 * them accordingly. For 'ECONNREFUSED' errors, it logs the error and responds to
 * the client with a 503-Service Unavailable status, indicating that the service
 * is temporarily unable to handle the request. This specific handling is useful
 * for gracefully informing clients of temporary issues affecting backend services
 * or database connections.
 *
 * Errors not specifically handled by this middleware are passed on to the next
 * error handler in the chain, which could be Express's default error handler or
 * a custom error handler defined later in the middleware stack. This allows for
 * a layered approach to error handling where errors can be filtered, logged,
 * transformed, or handled in various ways depending on their type and the
 * application's needs.
 *
 * @param {Error} error - The error object thrown during request processing.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - A callback to pass control to the next error handler.
 */
app.use((error, req, res, next) => {
    if (error.code === 'ECONNREFUSED') {
        // Handle ECONNREFUSED error specifically
        loggerConfig.error('Connection refused error:', error);

        res.status(httpStatus.SERVICE_UNAVAILABLE).send(
            'Service temporarily unavailable. Please try again later.'
        );
    } else {
        // Pass other errors to the default error handler or a custom one
        next(error);
    }
});

// /**
//  * General error handling middleware for operational errors.
//  * Logs the error stack, notifies administrators via email, and prepares a formatted error message response.
//  * Catches failures in email notification and still responds with the formatted error message.
//  */
// // do not remove the unused next parameter, otherwise the email mechanism will not work
// app.use((error, req, res, next) => {
//     console.error(error.stack);
//
//     const emailSubject = 'Node Express Boilerplate: Uncaught Server Exception';
//
//     EmailService.sendEmail(
//         config.admin.email,
//         emailSubject,
//         errorEmailBody(error)
//     );
//
//     return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(error.message);
// });

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
