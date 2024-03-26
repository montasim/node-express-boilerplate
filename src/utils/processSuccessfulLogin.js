/**
 * @fileoverview Login Success Handler for a Node.js Express API utilizing MongoDB.
 *
 * This module provides essential functionality to manage user sessions and enforce session control policies
 * immediately after a user successfully logs into the application. It encapsulates post-authentication tasks such as:
 * - Resetting the user's login attempt counter and unlocking the account if previously locked due to failed attempts.
 * - Cleaning up expired session tokens to maintain a fresh session state.
 * - Enforcing active session limits per user to prevent excessive simultaneous logins, enhancing security and resource management.
 *
 * It interacts closely with the User Service for user account updates, Auth Services for session token management,
 * and Email Service for notifying users about session-related concerns. This module ensures that each successful login
 * adheres to configured policies regarding login attempts, account locking, and active session limits.
 *
 * Through rigorous session management and user notification mechanisms, it contributes to the overall security posture
 * of the application by mitigating risks associated with account locking and session hijacking.
 */

import httpStatus from 'http-status';

import config from '../config/config.js';
import EmailService from '../modules/email/email.service.js';
import userService from '../modules/user/user.service.js';
import AuthServices from '../modules/auth/auth.service.js';

/**
 * Processes tasks associated with a successful user login, including resetting login attempt counters,
 * unlocking the account if locked, handling token cleanup, and enforcing active session limits.
 *
 * This function is a critical part of post-authentication processes. First, it resets the user's login attempt counter
 * and unlocks their account if it was locked due to failed login attempts. Then, it manages session tokens by deleting expired ones
 * and checks the number of active sessions against a configured limit. If the number of active sessions exceeds the limit,
 * it notifies the user via email and throws an error, preventing the login.
 *
 * @param {Object} userDetails An object containing details of the user who has logged in. Expected to include user ID, maximum login attempts, account lock status, lock duration, name, and email.
 * @throws {Object} Throws an object with `statusCode` and `message` if the user exceeds the allowed number of active sessions.
 * @example
 * const userDetails = {
 *   id: 'userId123',
 *   maximumLoginAttempts: 1,
 *   isLocked: false,
 *   lockDuration: null,
 *   name: 'John Doe',
 *   email: 'john.doe@example.com',
 * };
 *
 * processSuccessfulLogin(userDetails)
 *   .then(() => {
 *     console.log('User login processed successfully.');
 *   })
 *   .catch(error => {
 *     console.error('Error processing login:', error);
 *   });
 */
const processSuccessfulLogin = async userDetails => {
    const maximumLoginAttempts = config.auth.loginAttempts;

    // Reset the maximum login attempts and unlock the account
    if (
        userDetails?.maximumLoginAttempts < maximumLoginAttempts ||
        userDetails?.isLocked ||
        userDetails?.lockDuration
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
    if (activeTokensCount >= config.auth.activeSessions) {
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
