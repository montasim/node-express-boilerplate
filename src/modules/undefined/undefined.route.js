import express from 'express';

import undefinedController from './undefined.controller.js';

const router = express.Router();

router.all('/', undefinedController);

export default router;
