import express from 'express';

import indexController from './index.controller.js';

const router = express.Router();

// GET / - Show index page
router.all('/', indexController);

// GET /test-uncaught-exception - Throw error
router.all('/test-uncaught-exception', () => {
    throw new Error('Simulated uncaught exception');
});

export default router;
