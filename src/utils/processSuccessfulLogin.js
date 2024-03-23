import moment from 'moment';
import httpStatus from 'http-status';

import config from '../config/config.js';
import EmailService from '../modules/email/email.service.js';
import userService from '../modules/user/user.service.js';
import TokenService from '../modules/auth/token/token.service.js';
import tokenTypes from '../config/tokens.config.js';
import AuthServices from '../modules/auth/auth.service.js';

const processSuccessfulLogin = async userDetails => {
    const maximumLoginAttempts = config.auth.loginAttempts;

    // Reset the maximum login attempts and unlock the account
    if (
        userDetails?.maximumLoginAttempts < maximumLoginAttempts ||
        userDetails?.isLocked !== false ||
        userDetails?.lockDuration !== null
    ) {
        await userService.updateUserById(userDetails?.id, {
            maximumLoginAttempts: maximumLoginAttempts,
            isLocked: false,
            lockDuration: null,
        });
    }

    const { tokens, expiredTokens } =
        await AuthServices.deleteExpiredTokens(userDetails);

    // After successful login, check active (non-expired) sessions
    const activeTokensCount = tokens?.length - expiredTokens?.length;

    // Check if the user has more than 3 active sessions
    if (activeTokensCount > config.auth.activeSessions) {
        // Send the verification email
        await EmailService.sendMaximumActiveSessionEmail(
            userDetails?.name,
            userDetails?.email
        );

        throw {
            statusCode: httpStatus.FORBIDDEN,
            message: `Too many active sessions. Maximum ${config.auth.activeSessions} session allowed at a time. Please logout from one of the active sessions.`,
        };
    }
};

export default processSuccessfulLogin;
