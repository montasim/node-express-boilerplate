import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';

import tokenService from '../token/token.service.js';
import userService from '../user/user.service.js';
import TokenService from '../token/token.service.js';
import TokenModel from '../token/token.model.js';
import { tokenTypes } from '../../config/tokens.js';

import ServerError from '../../utils/serverError.js';

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
    try {
        const userDetails = await userService.getUserByEmail(email);

        if (!userDetails || userDetails.email !== email) {
            return {
                serviceSuccess: false,
                serviceStatus: httpStatus.UNAUTHORIZED,
                serviceMessage: 'Wrong email or password',
                serviceData: {},
            };
        }

        // if (userDetails.failedLoginDetails?.length >= MAX_FAILED_LOGIN_ATTEMPTS) {
        //     return {
        //         serviceSuccess: false,
        //         serviceStatus: httpStatus.LOCKED,
        //         serviceMessage: 'Your account has been locked. Please contact support.',
        //         serviceData: {},
        //     };
        // }
        //
        // if (userDetails?.mustChangePassword) {
        //     return {
        //         serviceSuccess: false,
        //         serviceStatus: httpStatus.FORBIDDEN,
        //         serviceMessage: 'Please change your password before proceeding.',
        //         serviceData: {},
        //     };
        // }
        //
        // if (userDetails.activeSessionDetails?.length >= MAX_CONCURRENT_LOGINS) {
        //     return {
        //         serviceSuccess: false,
        //         serviceStatus: httpStatus.FORBIDDEN,
        //         serviceMessage: `Maximum concurrent login device limit reached. You can log in a maximum ${MAX_CONCURRENT_LOGINS} device at a time. Please log out from another device before logging in.`,
        //         serviceData: {},
        //     };
        // }

        const passwordMatch = await bcrypt.compare(
            password,
            userDetails.password
        );

        if (!passwordMatch) {
            // await updateUserWithFailedLoginDetails(userDetails, device);

            return {
                serviceSuccess: false,
                serviceStatus: httpStatus.UNAUTHORIZED,
                serviceMessage: 'Wrong email or password',
                serviceData: {},
            };
        }

        const { serviceData } =
            await TokenService.generateAuthTokens(userDetails);

        // Convert the Mongoose document to a plain JavaScript object
        let userData = userDetails.toObject();

        // Remove the password field from the object
        delete userData.password;

        return {
            serviceSuccess: true,
            serviceStatus: serviceData
                ? httpStatus.OK
                : httpStatus.UNAUTHORIZED,
            serviceMessage: serviceData
                ? 'Login successful.'
                : 'Invalid email or password',
            serviceData: {
                ...userData,
                token: serviceData,
            },
        };
    } catch (error) {
        return {
            controllerSuccess: false,
            serviceData: {},
            serviceMessage: 'Internal server error',
            serviceStatus: httpStatus.INTERNAL_SERVER_ERROR,
        };
    }
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async refreshToken => {
    const refreshTokenDoc = await TokenModel.findOne({
        token: refreshToken,
        type: tokenTypes.REFRESH,
        blacklisted: false,
    });
    if (!refreshTokenDoc) {
        throw new ServerError(httpStatus.NOT_FOUND, 'Not found');
    }
    await refreshTokenDoc.remove();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async refreshToken => {
    try {
        const refreshTokenDoc = await tokenService.verifyToken(
            refreshToken,
            tokenTypes.REFRESH
        );
        const user = await userService.getUserById(refreshTokenDoc.user);
        if (!user) {
            throw new Error();
        }
        await refreshTokenDoc.remove();
        return tokenService.generateAuthTokens(user);
    } catch (error) {
        throw new ServerError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
    try {
        const resetPasswordTokenDoc = await tokenService.verifyToken(
            resetPasswordToken,
            tokenTypes.RESET_PASSWORD
        );
        const user = await userService.getUserById(resetPasswordTokenDoc.user);
        if (!user) {
            throw new Error();
        }
        await userService.updateUserById(user.id, { password: newPassword });
        await TokenModel.deleteMany({
            user: user.id,
            type: tokenTypes.RESET_PASSWORD,
        });
    } catch (error) {
        throw new ServerError(httpStatus.UNAUTHORIZED, 'Password reset failed');
    }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async verifyEmailToken => {
    try {
        const verifyEmailTokenDoc = await tokenService.verifyToken(
            verifyEmailToken,
            tokenTypes.VERIFY_EMAIL
        );
        const user = await userService.getUserById(verifyEmailTokenDoc.user);
        if (!user) {
            throw new Error();
        }
        await TokenModel.deleteMany({
            user: user.id,
            type: tokenTypes.VERIFY_EMAIL,
        });
        await userService.updateUserById(user.id, { isEmailVerified: true });
    } catch (error) {
        throw new ServerError(
            httpStatus.UNAUTHORIZED,
            'Email verification failed'
        );
    }
};

const AuthServices = {
    loginUserWithEmailAndPassword,
    logout,
    refreshAuth,
    resetPassword,
    verifyEmail,
};

export default AuthServices;
