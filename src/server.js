import mongoose from 'mongoose';

import app from './app.js';
import config from './config/config.js';
import logger from './config/logger.js';
import EmailService from './modules/email/email.service.js';

let server;

// eslint-disable-next-line promise/catch-or-return
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info('🚀 Connected to MongoDB');

    server = app.listen(config.port, () => {
        logger.info(`✅  Listening to port ${config.port}`);
    });
});

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed');

            // eslint-disable-next-line no-process-exit
            process.exit(1);
        });
    } else {
        // eslint-disable-next-line no-process-exit
        process.exit(1);
    }
};

const unexpectedErrorHandler = async (type, error) => {
    logger.error(error);

    console.error(type, error);

    exitHandler();
};

process.on('uncaughtException', async error => {
    await unexpectedErrorHandler('uncaughtException', error);

    await EmailService.sendUncaughtExceptionEmail(error);
});

process.on('unhandledRejection', async error => {
    await unexpectedErrorHandler('unhandledRejection', error);

    await EmailService.sendUnhandledRejectionEmail(error);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');

    if (server) {
        server.close();
    }
});

// process.on('SIGINT', () => {
//     logger.info('SIGINT received');
//
//     if (server) {
//         server.close();
//     }
// });
