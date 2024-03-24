/**
 * @fileoverview Asynchronous Error Handler Middleware for Node.js Express APIs.
 *
 * This utility module provides a higher-order function designed to wrap asynchronous Express route handlers
 * and middleware, offering a streamlined approach to error handling without cluttering the codebase with repetitive
 * try-catch blocks. It captures any exceptions thrown during the execution of asynchronous operations and
 * automatically forwards them to Express's built-in error handling middleware.
 *
 * This enhancement facilitates cleaner and more readable code by abstracting error handling mechanics, allowing
 * developers to focus on implementing the core business logic of route handlers and middleware functions. It is an
 * essential utility for developing robust, production-ready Node.js Express applications that interact with MongoDB
 * or any other databases, ensuring that all potential asynchronous errors is gracefully managed and properly reported.
 */

/**
 * Wraps an asynchronous function (typically an Express route handler) in a try-catch block to
 * catch any errors and pass them to Express's error handling middleware. This function eliminates
 * the need for repetitive try-catch blocks in asynchronous route handlers by automatically forwarding
 * errors to the next error handler in the middleware stack.
 *
 * By using this wrapper, developers can write cleaner and more readable asynchronous route handlers,
 * focusing on the route's logic rather than error handling boilerplate.
 *
 * @param {Function} fn An asynchronous route handler function that takes Express's `req`, `res`, and `next` parameters.
 * @returns {Function} A new function that wraps the original asynchronous function, with error handling added.
 * @example
 * // Example of wrapping an async route handler
 * app.get('/api/data', asyncErrorHandler(async (req, res, next) => {
 *     const data = await fetchData();
 *     res.json(data);
 * }));
 *
 * // Without asyncErrorHandler, the above would need explicit error handling:
 * app.get('/api/data', async (req, res, next) => {
 *     try {
 *         const data = await fetchData();
 *         res.json(data);
 *     } catch (error) {
 *         next(error);
 *     }
 * });
 */
const asyncErrorHandler = fn => async (req, res, next) => {
    try {
        // Await the execution of the passed-in function
        await fn(req, res, next);
    } catch (error) {
        // In case of an error, pass it to the next error handling middleware
        next(error);
    }
};

export default asyncErrorHandler;
