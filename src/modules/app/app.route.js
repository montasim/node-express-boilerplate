import express from 'express';

import indexRoute from '../index/index.route.js';
import apiRoute from '../api/api.route.js';
import docsRoute from '../docs/docs.route.js';
import config from '../../config/config.js';

const router = express.Router();

const defaultRoutes = [
    {
        path: '/',
        route: indexRoute,
    },
    {
        path: `/api/${config.version}`,
        route: apiRoute,
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
