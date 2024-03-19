/**
 * This is the main entry point for the Node.js application. It includes the initialization of the server,
 * setting up the database connection, and handling of global error events such as uncaught exceptions and
 * unhandled promise rejections. It ensures that the application gracefully handles shutdown signals and
 * logs critical information for debugging. This script leverages external modules for app configuration,
 * logging, database connection, and email notifications to maintain a robust and reliable service.
 *
 * @fileoverview Initializes the server, connects to the database, and sets up global error handling.
 * @requires app The main Express application module.
 * @requires DatabaseMiddleware A module to manage the database connection.
 * @requires config Configuration settings for the application.
 * @requires loggerConfig A logging utility to standardize log format and levels.
 * @requires EmailService A service module for sending email notifications on errors.
 */

import app from './app.js';
import config from './config/config.js';
import loggerConfig from './config/logger.config.js';
import EmailService from './modules/email/email.service.js';
import Middleware from './middleware/middleware.js';

let server;

/**
 * Starts the web server listening on a specified port. It logs the startup
 * status including the port number and environment mode. This function is
 * essential for bootstrapping the application and making it ready to accept
 * incoming HTTP requests.
 */
const startServer = () => {
    server = app.listen(config.port, () => {
        loggerConfig.info(`✅  Listening to port ${config.port}`);
        loggerConfig.info(`💻  Loading environment for ${config.env}`);
    });
};

/**
 * Initializes the application by establishing a database connection followed by starting the server.
 * It encapsulates the primary startup logic including error handling during the initialization phase.
 * If the database connection fails, it logs the error without proceeding to start the server.
 */
const initialize = async () => {
    try {
        await Middleware.database.connect();

        startServer();
    } catch (error) {
        loggerConfig.error('Failed to connect to the database:', error);
    }
};

initialize(); // Start the application by initializing it.

/**
 * Gracefully shuts down the server. This function is designed to be called
 * when the application is terminating, either due to receiving a termination
 * signal like SIGTERM or SIGINT, or due to an uncaught exception or unhandled
 * promise rejection. It ensures that all server connections are closed
 * properly before the application exits, which helps in preventing resource
 * leaks and ensuring that the application shuts down cleanly.
 *
 * If the server is currently running (indicated by the presence of the `server`
 * object), it attempts to close the server. The `server.close()` method is used
 * to stop the server from accepting new connections and keeps existing connections
 * until they are handled, ensuring a graceful shutdown. A callback is provided
 * to `server.close()` to perform actions once the server is successfully closed,
 * such as logging a message to indicate the server has closed and then exiting
 * the process with an error status code to signal that the application did not
 * shut down under normal circumstances.
 *
 * If the server is not running or if the `server` object is not present,
 * the function immediately exits the process with an error status code. This
 * covers scenarios where the application might need to shut down before the server
 * has started or if the server encountered an error during initialization.
 *
 * @async
 * @function exitHandler
 * @returns {Promise<void>} A promise that resolves when the server has been
 *                          successfully closed and the process exits, or
 *                          rejects if an error occurs during server closure.
 */
const exitHandler = async () => {
    if (server) {
        await new Promise((resolve, reject) => {
            server.close(error => {
                if (error) {
                    console.error('Error closing server:', error);

                    reject(error); // or resolve to avoid throwing

                    return;
                }

                loggerConfig.info('Server closed');

                resolve();
            });
        });

        // eslint-disable-next-line no-process-exit
        process.exit(1);
    } else {
        // eslint-disable-next-line no-process-exit
        process.exit(1);
    }
};

/**
 * Handles unexpected errors by logging them and then gracefully shutting down the application.
 * This function is used for both uncaught exceptions and unhandled promise rejections,
 * ensuring that the application does not remain in an unstable state.
 *
 * @param {string} type - The type of the error (uncaughtException or unhandledRejection).
 * @param {Error} error - The error object that was thrown.
 */
const unexpectedErrorHandler = async (type, error) => {
    loggerConfig.error(error);

    console.error(type, error);

    await exitHandler();
};

/**
 * An event listener for the global `uncaughtException` event. This listener is
 * triggered when an exception bubbles up to the top of the execution stack without
 * being caught by any `try...catch` block, indicating a potentially critical
 * application failure. The function handles such exceptions by logging them,
 * sending an email notification about the uncaught exception, and then initiating
 * a graceful shutdown of the application to prevent it from remaining in an unstable
 * state.
 *
 * @async
 * @param {Error} error The uncaught exception that triggered the event.
 * @returns {Promise<void>} A promise that resolves when the exception has been
 *                          handled and the application is in the process of
 *                          shutting down.
 */
process.on('uncaughtException', async error => {
    await unexpectedErrorHandler('uncaughtException', error);

    await EmailService.sendUncaughtExceptionEmail(error);
});

/**
 * An event listener for the global `unhandledRejection` event. This listener is
 * triggered when a promise is rejected and no error handler is attached to it
 * within a turn of the event loop. The function addresses such rejections by
 * logging the promise and the reason for rejection, and then invoking a
 * generalized error handler to manage the situation. This includes logging
 * the error and attempting a graceful application shutdown to maintain the
 * application's integrity.
 *
 * @async
 * @param {any} reason The object or error that caused the promise to be rejected.
 * @param {Promise} promise The promise that was rejected.
 * @returns {Promise<void>} A promise that resolves when the rejection has been
 *                          handled and the application is in the process of
 *                          shutting down.
 */
process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);

    await unexpectedErrorHandler('unhandledRejection', reason);
});

/**
 * An event listener for the `SIGTERM` signal, which is typically sent to indicate
 * that the application should terminate gracefully. This signal can be sent by
 * system administrators, orchestration tools like Kubernetes, or the operating
 * system itself in response to shut down commands. The function responds to this
 * signal by logging its receipt and then attempting to close the server
 * gracefully if it's running. This ensures that the application does not
 * abruptly terminate but instead completes current requests and releases
 * resources properly before shutting down.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when the server has been
 *                          successfully closed, or immediately if the server
 *                          was not running, indicating the process is ready
 *                          to exit.
 */
process.on('SIGTERM', async () => {
    loggerConfig.info('SIGTERM received');

    if (server) {
        server.close();
    }
});
