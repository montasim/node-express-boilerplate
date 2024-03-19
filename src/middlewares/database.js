/**
 * Database Connection Management Module.
 *
 * This module provides functionality to connect and disconnect to/from the MongoDB database using Mongoose. It configures
 * Mongoose to connect to the database as specified in the application's configuration settings. It handles connection events
 * such as errors, reconnection, and disconnection, logging relevant information for monitoring and debugging purposes.
 * Proper management of the database connection is crucial for the stability and performance of the application.
 *
 * @module utilities/Database
 * @requires mongoose Mongoose library for MongoDB object modeling.
 * @requires config Application configuration module to access database URLs.
 * @requires loggerConfig Custom logger for logging messages.
 */

import mongoose from 'mongoose';

import config from '../config/config.js';
import loggerConfig from '../config/logger.config.js';

/**
 * Establishes a connection to the MongoDB database using Mongoose.
 * It listens to various connection events (error, reconnected, and disconnected) to log and handle
 * them appropriately. In case of disconnection, it attempts to reconnect.
 *
 * This function is asynchronous and returns a promise that resolves upon successful connection
 * or rejects if the connection cannot be established.
 *
 * @async
 * @function connect
 * @returns {Promise<void>} A promise that resolves when the database connection is successful.
 */
const connect = async () => {
    // Setting up connection event listeners before initiating the connecting
    mongoose.connection.on('error', error =>
        loggerConfig.error(`Database connection error: ${error}`)
    );

    mongoose.connection.on('reconnected', () =>
        loggerConfig.info('Database reconnected')
    );

    mongoose.connection.on('disconnected', async () => {
        loggerConfig.info('Database disconnected! Attempting to reconnect...');

        try {
            await mongoose.connect(config.mongoose.url);

            loggerConfig.info('🚀 Database reconnected successfully');
        } catch (error) {
            loggerConfig.error('Database reconnection error:', error);
        }
    });

    try {
        await mongoose.connect(config.mongoose.url);
        loggerConfig.info('🚀 Database connected successfully');
    } catch (error) {
        loggerConfig.error('Database connection error:', error);

        throw error; // Re-throwing is necessary for the caller to handle it
    }
};

/**
 * Disconnects from the MongoDB database using Mongoose.
 * It logs the process of disconnection and handles any errors that may occur during the disconnection process.
 * This function is crucial for gracefully shutting down the application and releasing database resources.
 *
 * @async
 * @function disconnect
 * @returns {Promise<void>} A promise that resolves when the database has been successfully disconnected.
 */
const disconnect = async () => {
    try {
        // Log when the disconnection process starts
        loggerConfig.info('MongoDB is disconnecting...');

        await mongoose.disconnect();

        // Since listeners are set up per disconnect call, it logs directly after await
        loggerConfig.info('❌ Database disconnected successfully');
    } catch (error) {
        loggerConfig.error('Database disconnection error:', error);

        throw error; // Re-throwing is necessary for the caller to handle it
    }
};

const Database = {
    connect,
    disconnect,
};

export default Database;
