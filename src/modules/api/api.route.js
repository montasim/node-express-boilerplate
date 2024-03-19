import express from 'express';

import authRoute from '../auth/auth.route.js';
import permissionRoute from '../auth/permission/permission.route.js';
import roleRoute from '../auth/role/role.route.js';
import userRoute from '../user/user.route.js';

const router = express.Router();

router.use('/auth', authRoute);
router.use('/permission', permissionRoute);
router.use('/role', roleRoute);
router.use('/user', userRoute);

export default router;
