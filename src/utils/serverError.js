/**
 * @fileoverview Custom Error Class for Handling Server Errors in Node.js Applications.
 *
 * This module defines a custom error class, `ServerError`, extending the native JavaScript `Error` class,
 * designed to provide a structured approach to error handling within server-side applications. By incorporating
 * additional properties such as `statusCode` and `isOperational`, this class allows for more nuanced error
 * management, facilitating the differentiation between operational errors (which are part of the application's
 * normal functioning) and programmer errors (bugs).
 *
 * The `ServerError` class includes:
 * - `statusCode`: An HTTP status code that indicates the nature of the error to clients, enhancing the
 *   interoperability and clarity of server responses.
 * - `isOperational`: A boolean indicating whether the error is an operational error, thereby helping in decision-making
 *   processes for logging, retries, and user notifications.
 * - Custom stack trace management: While the class captures the stack trace by default (if not provided), it also
 *   offers the flexibility to accept a custom stack trace, aiding in debugging and error analysis.
 *
 * This class is intended for use throughout the application wherever error handling is required, particularly
 * in API responses, middleware, and asynchronous operations. To ensure consistent and meaningful error information
 * is available both for the end-users and for system logging purposes.
 */

/**
 * Represents a server-related error, extending the built-in Error class with additional
 * properties to aid in handling and reporting errors within a server or web application context.
 * This custom error class allows for specifying an HTTP status code and an operational flag
 * to distinguish between operational errors (anticipated errors that are part of the application's
 * normal functioning) and programmer errors (bugs). The class also optionally accepts a stack trace,
 * allowing for the provision of a custom stack trace or the automatic capture of the stack trace
 * at the point of instantiation.
 *
 * @extends Error
 */
class ServerError extends Error {
    /**
     * Constructs an instance of the ServerError class.
     *
     * @param {number} statusCode The HTTP status code associated with this error, indicating
     *                            the nature of the error in the context of HTTP requests.
     * @param {string} message The error message that describes the error. This message is passed
     *                         to the base Error class constructor and is accessible via the `message` property.
     * @param {boolean} [isOperational=true] A flag indicating whether the error is operational,
     *                                       meaning it is an expected error as part of the normal
     *                                       functioning of the application (as opposed to a programmer error).
     * @param {string} [stack=''] An optional stack trace for the error. If not provided,
     *                            the stack trace is captured automatically at the point where
     *                            the ServerError is instantiated.
     */
    constructor(statusCode, message, isOperational = true, stack = '') {
        super(message);

        this.statusCode = statusCode;
        this.isOperational = isOperational;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ServerError;
