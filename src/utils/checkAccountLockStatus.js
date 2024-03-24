/**
 * @fileoverview Account Lock Status Checker for User Authentication in Node.js Express APIs.
 *
 * This module defines a utility function crucial for security in user authentication processes. It checks if a user's account
 * is currently locked due to reasons such as repeated failed login attempts. If the account is locked and the lock period has not
 * expired, it calculates the remaining duration until the account becomes unlocked and notifies the user accordingly.
 *
 * Using `moment.js` for precise time calculations, this function assesses the account's lock status based on the current
 * time and the account's lock duration setting. It serves as an essential security feature to prevent unauthorized access
 * attempts while ensuring legitimate users are informed about their account status. Enhancing the overall user experience
 * by clearly communicating the time remaining until they can attempt to access their account again.
 *
 * This function is designed to be integrated into the authentication workflow of a Node.js Express application, particularly
 * before allowing users to proceed with login processes, thereby adding a layer of security and user information.
 */

import moment from 'moment';
import httpStatus from 'http-status';

/**
 * Checks the lock status of a user's account and calculates the remaining time until the account is unlocked, if applicable.
 *
 * This function takes a user's details as input and determines if the account is locked by evaluating the `isLocked` and
 * `lockDuration` properties. If the account is locked and the lock duration has not yet expired, it calculates the remaining
 * lock time in a human-friendly format and throws an error with this information. This ensures that users attempting to
 * access their account during a lock period are appropriately informed of when they can try again.
 *
 * @param {Object} userDetails An object containing the user's account details, including the lock status and lock duration.
 * @throws {Object} Throws an object with `statusCode` and `message` properties if the account is currently locked, indicating
 *                  the remaining duration of the lock. The `statusCode` is set to `httpStatus.FORBIDDEN`.
 * @example
 * // Example usage within an authentication process
 * try {
 *     await checkAccountLockStatus(userDetails);
 *     // Proceed with authentication...
 * } catch (error) {
 *     if (error.statusCode === httpStatus.FORBIDDEN) {
 *         console.log(error.message); // Logs: 'Account is locked. Please try again in x minutes.'
 *     }
 * }
 */
const checkAccountLockStatus = async userDetails => {
    // Handle account lock status and check for lock duration
    if (userDetails?.isLocked && userDetails?.lockDuration) {
        const lockDuration = moment.utc(userDetails.lockDuration); // Moment object of lockDuration
        const currentTime = moment.utc(); // Current time in UTC

        // Check if the lockDuration is still in the future compared to the current time
        if (lockDuration.isAfter(currentTime)) {
            // Calculate the remaining lock time in a human-friendly format
            const remainingLockTime = lockDuration.fromNow();

            throw {
                statusCode: httpStatus.FORBIDDEN,
                message: `Account is locked. Please try again after ${remainingLockTime}.`,
            };
        }
    }
};

export default checkAccountLockStatus;
