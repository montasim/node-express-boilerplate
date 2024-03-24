/**
 * @fileOverview Functions for processing failed login attempts and updating user details accordingly.
 * @module FailedLoginProcessor
 */

import moment from 'moment';
import httpStatus from 'http-status';

import EmailService from '../modules/email/email.service.js';
import userService from '../modules/user/user.service.js';
import config from '../config/config.js';

/**
 * Processes a failed login attempt by updating user's login attempts count and lock status if necessary.
 * @param {Object} userDetails - The details of the user attempting to log in.
 * @param {string} userDetails.id - The unique identifier of the user.
 * @param {number} userDetails.maximumLoginAttempts - The maximum allowed login attempts for the user.
 * @param {string} userDetails.name - The name of the user.
 * @param {string} userDetails.email - The email of the user.
 * @returns {Promise<void>} - A promise that resolves once the login attempt is processed.
 * @throws {Object} - An object containing status code and message if the login attempt fails.
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
