import authMiddleware from './auth.middleware.js';
import DatabaseMiddleware from './database.middleware.js';
import ErrorMiddleware from './error.middleware.js';
import fileUploadMiddleware from './fileUpload.middleware.js';
import rateLimiter from './rateLimiter.middleware.js';
import validateRequestMiddleware from './validateRequest.middleware.js';
import sanitizeRequest from './sanitizeRequest.middleware.js';

const Middleware = {
    auth: authMiddleware,
    database: DatabaseMiddleware,
    error: ErrorMiddleware,
    fileUpload: fileUploadMiddleware,
    rateLimit: rateLimiter,
    validateRequest: validateRequestMiddleware,
    sanitize: sanitizeRequest,
};

export default Middleware;
