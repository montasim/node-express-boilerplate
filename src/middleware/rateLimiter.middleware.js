import rateLimit from 'express-rate-limit';

import config from '../config/config.js';

const rateLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    headers: true,
    skipSuccessfulRequests: true,
});

export default rateLimiter;
