/**
 * @fileoverview Module for Handling Failed Login Attempts in Node.js Applications.
 *
 * The `FailedLoginProcessor` module provides functionalities for securely managing failed login attempts,
 * thereby enhancing the application's security against brute force attacks. It includes a main function
 * `processFailedLoginAttempt` that tracks the number of consecutive failed login attempts for a user and
 * applies account lockout mechanisms as necessary. This module plays a crucial role in protecting user accounts
 * by temporarily locking them after a configurable number of unsuccessful login attempts and alerting users
 * about the account lock via email.
 *
 * Features:
 * - Decrementing the count of remaining login attempts after each failed attempt.
 * - Locking the user account for a configurable duration upon reaching the maximum number of failed attempts.
 * - Sending an email notification to users when their account gets locked, providing them with information
 *   on when they can attempt to log in again.
 *
 * This functionality is vital for maintaining the integrity and security of user accounts within an application,
 * ensuring that users are promptly informed of unusual login activities and that their accounts are safeguarded
 * against unauthorized access attempts.
 *
 * Usage:
 * The module is intended to be utilized within the login flow, particularly in scenarios where user authentication
 * fails. It operates by updating user records with the new login attempt count and, if applicable, the account lock
 * status and duration, contributing to a secure and user-friendly authentication process.
 */

import moment from 'moment';
import httpStatus from 'http-status';

import EmailService from '../modules/email/email.service.js';
import userService from '../modules/user/user.service.js';
import config from '../config/config.js';

/**
 * Handles a failed login attempt by updating the user's record to decrement the remaining login attempts
 * and potentially lock the account if the maximum number of failed attempts is reached. If the account
 * is locked, it sets a lock duration and sends an email to the user notifying them of the account lock.
 * This function is essential for enhancing security by preventing brute-force attacks and informing users
 * of suspicious activity on their accounts.
 *
 * @param {Object} userDetails An object containing details of the user attempting to log in. This includes
 *                             their ID, current number of remaining login attempts, and user contact information.
 * @throws {Object} Throws an object containing the HTTP status code and a message indicating either the number
 *                  of remaining attempts or that the account has been locked.
 * @example
 * // Example usage within a login attempt
 * try {
 *     await processFailedLoginAttempt(user);
 * } catch (error) {
 *     // Handle the error, e.g., by sending it to the client
 *     res.status(error.statusCode).send(error.message);
 * }
 */
const processFailedLoginAttempt = async userDetails => {
    const attemptsLeft = userDetails?.maximumLoginAttempts - 1;

    // Ensure maximumLoginAttempts does not become less than 0
    const updatedLoginAttempts = Math.max(attemptsLeft, 0);

    // Update the maximum failed login attempts with the new value
    await userService.updateUserById(userDetails?.id, {
        maximumLoginAttempts: updatedLoginAttempts,
    });

    if (updatedLoginAttempts === 0) {
        // Use moment.utc() to work with GMT time
        const lockDuration = moment
            .utc()
            .add(config.auth.lockDuration, 'hours')
            .toDate();

        // Update the isLocked status to true and set the lockDuration in GMT
        await userService.updateUserById(userDetails?.id, {
            isLocked: true,
            lockDuration: lockDuration,
        });

        await EmailService.sendAccountLockedEmail(
            userDetails?.name,
            userDetails?.email
        );
    }

    throw {
        statusCode: httpStatus.UNAUTHORIZED,
        message:
            updatedLoginAttempts > 0
                ? `Wrong email or password. ${updatedLoginAttempts} attempts left.`
                : 'Account locked due to too many failed login attempts. Please try again in 1 hour.',
    };
};

export default processFailedLoginAttempt;
