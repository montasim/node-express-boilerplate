import NodeCache from 'node-cache';
import loggerConfig from '../config/logger.config.js';

const cache = new NodeCache();

const create = (duration = 3600) => {
    return (req, res, next) => {
        let key;

        // If the request is a GET request, extract the resource name from the URL
        if (req.method === 'GET') {
            // Extract the resource name from the URL
            const urlSegments = req.originalUrl.split('/');

            key = urlSegments[urlSegments.length - 1].split('?')[0];
        } else {
            const routeName = req.route.path
                .replace(/\//g, '_')
                .replace(/:/g, '');

            key = `${routeName}_${req.method}_${req.originalUrl || req.url}`;
        }

        // Check if the key exists in the cache
        if (req.method === 'GET') {
            const cachedBody = cache.get(key);

            if (cachedBody) {
                loggerConfig.info(`🍪 Serving from cache: ${key}`);

                return res.status(cachedBody.status).send(cachedBody.body);
            } else {
                const originalSend = res.send.bind(res);
                const originalStatus = res.status.bind(res);
                let responseStatus = 200;

                // Override the send method to cache the response
                res.status = code => {
                    responseStatus = code;

                    return originalStatus(code);
                };

                // Override the send method to cache the response
                res.send = body => {
                    if (responseStatus >= 200 && responseStatus < 300) {
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
            next();
        }
    };
};

const invalidate = routeName => {
    return (req, res, next) => {
        // Directly use the routeName as the key to invalidate
        const keys = cache.keys();

        // Loop through all the keys in the cache and delete the ones that match the routeName
        keys.forEach(key => {
            if (key.startsWith(routeName)) {
                cache.del(key);
            }
        });

        next();
    };
};

const CacheMiddleware = {
    create,
    invalidate,
};

export default CacheMiddleware;
