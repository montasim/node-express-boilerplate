/**
 * Session Configuration Module.
 *
 * This module provides configuration settings for managing session state in the Express.js application.
 * It uses `connect-mongo` as a session store, which leverages MongoDB for persisting session data.
 * This approach ensures sessions are maintained across server restarts and provides a scalable method
 * for session storage. The configuration includes security settings for cookies to enhance application
 * security, especially in production environments.
 *
 * Features include:
 * - Storing sessions in MongoDB for persistence and scalability.
 * - Configuring cookie security settings such as HttpOnly and Secure flags.
 * - Disabling session initialization and saving for unmodified sessions to optimize performance.
 *
 * @module config/sessionConfig
 * @requires connect-mongo Middleware for MongoDB session storage.
 * @requires config Configuration module for accessing-environment-specific settings.
 */

import MongoStore from 'connect-mongo';
import config from './config.js';

/**
 * Session configuration object for use with Express session middleware.
 *
 * @type {Object}
 * @property {MongoStore} store - Configures MongoDB as the session store using the `connect-mongo` package.
 * @property {string} secret - A secret used to sign the session ID cookie, pulled from environment-specific configuration.
 * @property {boolean} saveUninitialized - Flag to prevent saving uninitialized session to the store.
 * @property {boolean} resave - Flag to prevent saving session to the store if it hasn't been modified.
 * @property {Object} cookie - Configuration for the session ID cookie.
 * @property {boolean} cookie.secure - Ensures the cookie is sent only over HTTPS. Enabled in production.
 * @property {boolean} cookie.httpOnly - Restricts cookie access to HTTPS APIs, preventing client-side scripts from accessing it.
 * @property {string} cookie.sameSite - Controls whether cookies are sent with cross-site requests. Provides some protection against CSRF attacks.
 * @property {number} cookie.maxAge - Sets the cookie expiration time in milliseconds. Configured for 24 hours.
 */
const sessionConfig = {
    store: MongoStore.create({
        mongoUrl: config.mongoose.url, // MongoDB's connection string for session storage.
    }),
    secret: config.jwt.secret, // Secret for signing the session ID cookie.
    saveUninitialized: false, // Do not save uninitialized sessions to the store.
    resave: false, // Do not save sessions back to the session store if they haven't been modified.
    cookie: {
        secure: config.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS required).
        httpOnly: true, // Prevent a client-side script from accessing the cookie.
        sameSite: 'strict', // Strict sameSite policy to mitigate CSRF.
        maxAge: 24 * 60 * 60 * 1000, // Cookie expiration set to 24 hours.
    },
};

export default sessionConfig;
