/**
 * Helmet Configuration Module.
 *
 * This module exports configuration settings for Helmet, middleware for Express.js applications that
 * sets various HTTP headers to help protect the app from some well-known web vulnerabilities by setting
 * HTTP headers appropriately. Specifically, this configuration addresses content security policy (CSP)
 * and referrer policy to mitigate risks such as cross-site scripting (XSS), blackjacking, and other code
 * injection attacks stemming from malicious content.
 *
 * The Content Security Policy (CSP) is a critical security concept that serves as allowed list for content
 * sources, thus preventing the browser from loading malicious assets. The referrer policy setting controls
 * how much information the browser includes with navigation away from a document and is used to protect
 * user privacy.
 *
 * @module config/helmetConfig
 * @see @link https://helmetjs.github.io/|Helmet for more details on Helmet and its configurations.
 */

/**
 * Configuration object for Helmet, focusing on the content security policy (CSP)
 * and referrer policy to enhance the security of the web application.
 *
 * @type {Object}
 * @property {Object} contentSecurityPolicy - Configures the Content Security Policy to define the origins from which content can be loaded.
 * @property {Object} contentSecurityPolicy.directives - Specifies the actual directives for the content security policy.
 * @property {string[]} contentSecurityPolicy.directives.defaultSrc - Specifies the default source list for fetching resources such as JavaScript, images, CSS, fonts, AJAX requests, frames, HTML5 media.
 * @property {string[]} contentSecurityPolicy.directives.scriptSrc - Defines valid sources of JavaScript.
 * @property {string[]} contentSecurityPolicy.directives.objectSrc - Defines valid sources of plugins, such as `<object>`, `<embed>`, or `<applet>`.
 * @property {string[]} contentSecurityPolicy.directives.imgSrc - Defines valid sources of images.
 * @property {string[]} contentSecurityPolicy.directives.styleSrc - Defines valid sources of stylesheets.
 * @property {Array} contentSecurityPolicy.directives.upgradeInsecureRequests - If added, the browser upgrades all HTTP requests to HTTPS.
 * @property {Object} referrerPolicy - Configures the Referrer Policy of the web application.
 * @property {string} referrerPolicy.policy - Sets the policy for the Referrer header by which the browser sets the header for outgoing requests.
 */
const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"], // Only allow content from the current domain
            scriptSrc: ["'self'"], // Only allow scripts from the current domain
            objectSrc: ["'none'"], // Disallow plugins (Flash, Silverlight, etc.)
            imgSrc: ["'self'"], // Only allow images from the current domain
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles and CSS from self
            upgradeInsecureRequests: [], // Upgrade all HTTP requests to HTTPS
        },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // Only send the origin of the document as the referrer in all other cases
};

export default helmetConfig;
