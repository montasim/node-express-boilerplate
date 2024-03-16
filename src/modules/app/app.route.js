import express from 'express';

import apiRoute from '../api/api.route.js';
import docsRoute from '../docs/docs.route.js';
import config from '../../config/config.js';
import undefinedRoute from '../undefined/undefined.route.js';

const router = express.Router();

const defaultRoutes = [
    {
        path: `/api/${config.version}`,
        route: apiRoute,
    },
    {
        path: '*',
        route: undefinedRoute,
    },
];

// routes available only in development mode
const devRoutes = [
    {
        path: '/docs',
        route: docsRoute,
    },
];

defaultRoutes.forEach(route => {
    router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
    devRoutes.forEach(route => {
        router.use(route.path, route.route);
    });
}

export default router;
