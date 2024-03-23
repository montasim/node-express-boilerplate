import moment from 'moment';
import httpStatus from 'http-status';

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
