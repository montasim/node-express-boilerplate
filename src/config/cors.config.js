/**
 * CORS Configuration Module.
 *
 * This module exports the configuration settings for Cross-Origin Resource Sharing (CORS) used by the Express application.
 * It sets up rules that specify which origins, HTTP methods, and headers are permitted to access resources on the server.
 * This configuration is critical for securing the application by allowing requests from trusted origins and methods while
 * supporting credentials for authenticated sessions.
 *
 * @module config/corsConfig
 * @see @link https://expressjs.com/en/resources/middleware/cors.html|cors for more details on CORS middleware.
 */

import config from './config.js';

/**
 * CORS configuration object-defining rules for cross-origin requests.
 *
 * @type {Object}
 * @property {string|string[]} origin - Specifies the origin(s) that may access the resource. It Can be a single origin or an array of origins.
 * @property {string|string[]} methods - Specifies the method(s) allowed when accessing the resource. This is used in response to a preflight request.
 * @property {boolean} credentials - Indicates whether the request can include user credentials like cookies, HTTP authentication or client-side SSL certificates.
 */
const corsConfig = {
    origin: config.cors.origin, // The allowed origin(s) for requests. Configurable through the main config file.
    methods: config.cors.methods, // The allowed HTTP method(s) for cross-origin requests.
    credentials: true, // Enable support for credentials in cross-origin requests.
};

export default corsConfig;
