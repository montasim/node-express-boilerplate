import express from 'express';

import authRoute from '../auth/auth.route.js';
import userRoute from '../user/user.route.js';

const router = express.Router();

router.use('/auth', authRoute);
router.use('/user', userRoute);

export default router;
