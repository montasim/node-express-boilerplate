/**
 * @fileoverview
 * This file contains a middleware function for sanitizing all string fields in the request body, query, and params
 * to prevent cross-site scripting (XSS) attacks in a production-ready Node.js, Express, and MongoDB API. The middleware
 * recursively checks all string fields in the request object and sanitizes them using the DOMPurify library, which
 * provides robust XSS protection.
 *
 * Sanitization of input data is essential for maintaining the security and integrity of the application, especially
 * when dealing with user-generated content or data coming from external sources. By incorporating this middleware into
 * the request processing pipeline, the API can effectively mitigate the risk of XSS vulnerabilities by cleansing
 * potentially malicious HTML and ensuring that only safe content is processed and rendered.
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');
const dompurify = DOMPurify(window);

/**
 * Sanitizes all string fields in the request body, query, and params to prevent XSS attacks.
 * This middleware recursively checks all string fields in the request object and sanitizes
 * them using the DOMPurify library. It supports nested objects.
 *
 * @param {Object} req - The request object from Express.js containing the body, query,
 * and params properties that may need sanitization.
 * @param {Object} res - The response object from Express.js. This function does not directly
 * modify the response object but it's required by Express middleware convention.
 * @param {Function} next - The callback function to pass control to the next middleware
 * in the stack.
 */
const sanitizeRequest = (req, res, next) => {
    const sanitize = obj => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = dompurify.sanitize(obj[key]);
            } else if (typeof obj[key] === 'object') {
                sanitize(obj[key]);
            }
        }
    };

    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);

    next();
};

export default sanitizeRequest;
