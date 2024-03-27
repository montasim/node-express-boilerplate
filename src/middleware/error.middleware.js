import mongoose from 'mongoose';
import httpStatus from 'http-status';

import config from '../config/config.js';
import logger from '../config/logger.config.js';

import ServerError from '../utils/serverError.js';

const errorConverter = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ServerError)) {
        const status =
            error.status || error instanceof mongoose.Error
                ? httpStatus.BAD_REQUEST
                : httpStatus.INTERNAL_SERVER_ERROR;
        const message = error.message || httpStatus[status];

        error = new ServerError(status, message, false, err.stack);
    }

    next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let { status, message } = err;

    if (config.env === 'production' && !err.isOperational) {
        status = httpStatus.INTERNAL_SERVER_ERROR;
        message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
    }

    res.locals.errorMessage = err.message;

    const response = {
        status: status,
        message,
        ...(config.env === 'development' && { stack: err.stack }),
    };

    if (config.env === 'development') {
        logger.error(err);
    }

    res.status(status).send(response);
};

const ErrorMiddleware = {
    errorConverter,
    errorHandler,
};

export default ErrorMiddleware;
