import express from 'express';

import authRoute from '../auth/auth.route.js';
import userRoute from '../user/user.route.js';

const router = express.Router();

/**
 * Integrates the authentication-related routes into the API.
 * The `authenticationRoutes` module handles endpoints related to the authentication process,
 * including user login, registration, and token refresh mechanisms.
 */
router.use('/auth', authRoute);
router.use('/user', userRoute);

export default router;
