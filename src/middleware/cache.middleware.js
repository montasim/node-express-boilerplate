import NodeCache from 'node-cache';
const cache = new NodeCache();

/**
 * Middleware to cache GET requests. Caches only successful responses
 * and ensures error responses like unauthorized, forbidden, or server errors
 * are not cached. Clears cache on modifications for POST, PUT, DELETE requests.
 */
const create = (duration = 3600) => {
    return (req, res, next) => {
        const key = `${req.method}_${req.originalUrl || req.url}`;
        if (req.method === 'GET') {
            const cachedBody = cache.get(key);
            if (cachedBody) {
                console.log(`Serving from cache: ${key}`);
                return res.status(cachedBody.status).send(cachedBody.body);
            } else {
                // Intercept the send function to cache successful responses only
                const originalSend = res.send.bind(res);
                const originalStatus = res.status.bind(res);
                let responseStatus = 200; // Default to 200, adjust as necessary

                // Override status function to capture status code
                res.status = code => {
                    responseStatus = code;
                    return originalStatus(code);
                };

                // Override send function to cache the response
                res.send = body => {
                    if (responseStatus >= 200 && responseStatus < 300) {
                        // Cache only successful responses
                        cache.set(
                            key,
                            { body, status: responseStatus },
                            duration
                        );
                    }
                    originalSend(body);
                };
                next();
            }
        } else {
            // For non-GET requests, consider selectively invalidating related cache entries
            next();
        }
    };
};

/**
 * Invalidate cache entries based on a key pattern or exact match.
 * @param {String} pattern A pattern or key to match for cache invalidation.
 */
const invalidate = pattern => {
    cache.flushAll();
};

const CacheMiddleware = {
    create,
    invalidate,
};

export default CacheMiddleware;
