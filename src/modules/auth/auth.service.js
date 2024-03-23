import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import moment from 'moment';

import sendServiceResponse from '../../utils/sendServiceResponse.js';
import processFailedLoginAttempt from '../../utils/processFailedLoginAttempt.js';
import processSuccessfulLogin from '../../utils/processSuccessfulLogin.js';
import excludeSensitiveFields from '../../utils/excludeSensitiveFields.js';

import tokenService from './token/token.service.js';
import userService from '../user/user.service.js';
import TokenService from './token/token.service.js';
import TokenModel from './token/token.model.js';
import tokenTypes from '../../config/tokens.config.js';
import RoleAggregationPipeline from './role/role.pipeline.js';
import RoleModel from './role/role.model.js';
import UserModel from '../user/user.model.js';
import EmailService from '../email/email.service.js';

const loginUserWithEmailAndPassword = async (email, password) => {
    const userDetails = await userService.getUserByEmail(email);

    // Early return if user doesn't exist or if the email is incorrect
    if (!userDetails || userDetails?.email !== email) {
        throw {
            statusCode: httpStatus.UNAUTHORIZED,
            message: 'Wrong email or password',
        };
    }

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

    const passwordMatch = await bcrypt.compare(password, userDetails?.password);

    // Check if the password is correct
    if (!passwordMatch) {
        // Process failed login attempt and possibly lock an account
        await processFailedLoginAttempt(userDetails);
    } else {
        // Process successful login
        await processSuccessfulLogin(userDetails);
    }

    const token = await TokenService.generateAuthTokens(userDetails);

    // Convert the Mongoose document to a plain JavaScript object
    let userData = userDetails.toObject();

    // Send the verification email
    await EmailService.sendSuccessfullLoginEmail(
        userData?.name,
        userData?.email
    );

    // Aggregation pipeline to fetch and populate the updated document
    const aggregationPipeline = RoleAggregationPipeline.getRole(
        userDetails?.role
    );

    // Fetch the updated permission using the aggregation pipeline
    const populatedPermission = await RoleModel.aggregate(aggregationPipeline);

    // Check if the populatedPermission query returned a document
    if (!populatedPermission || populatedPermission?.length === 0) {
        throw {
            statusCode: httpStatus.OK,
            message: 'User login successful but role population failed.',
        };
    }

    // Remove the password field from the object
    const fieldsToRemove = [
        '_id',
        '__v',
        'password',
        'role',
        'maximumLoginAttempts',
        'maximumResetPasswordAttempts',
        'maximumEmailVerificationAttempts',
        'maximumChangeEmailAttempts',
        'maximumChangePasswordAttempts',
    ];

    // Remove sensitive fields from userDetails
    const sanitizedUserDetails = excludeSensitiveFields(
        userDetails?.toObject(),
        fieldsToRemove
    );

    // Create the response object
    const response = {
        ...sanitizedUserDetails, // Spread sanitized user details instead of original userDetails
        role: populatedPermission[0], // Include role details
        token, // Include token
    };

    // Return the user data with the role and token
    return sendServiceResponse(
        token ? httpStatus.OK : httpStatus.UNAUTHORIZED,
        token ? 'Login successful.' : 'Invalid email or password',
        response
    );
};

const logout = async refreshToken => {
    // Verify if refreshToken is provided
    if (!refreshToken) {
        throw {
            statusCode: httpStatus.BAD_REQUEST,
            message: 'Refresh token is required.',
        };
    }

    const refreshTokenDoc = await TokenModel.findOneAndDelete({
        token: refreshToken,
        type: tokenTypes.REFRESH,
        blacklisted: false,
    });

    // If no document is found, throw an error to indicate the token was not found
    if (!refreshTokenDoc) {
        throw {
            statusCode: httpStatus.NOT_FOUND,
            message: 'Token not found or already logged out.',
        };
    }

    return sendServiceResponse(httpStatus.OK, 'Logout successful.', {});
};

const refreshAuth = async refreshToken => {
    const refreshTokenDoc = await TokenModel.findOne({
        token: refreshToken,
        type: tokenTypes.REFRESH,
    });

    const user = await UserModel.findOne({ id: refreshTokenDoc?.user });

    if (!user) {
        throw new Error();
    }

    await TokenModel.findOneAndDelete({ token: refreshToken });

    const newAuthToken = await tokenService.generateAuthTokens(user);

    return sendServiceResponse(
        httpStatus.OK,
        'Refresh successful.',
        newAuthToken
    );
};

const resetPassword = async (resetPasswordToken, newPassword) => {
    const resetPasswordTokenDoc = await tokenService.verifyToken(
        resetPasswordToken,
        tokenTypes.RESET_PASSWORD
    );

    const user = await userService.getUserById(resetPasswordTokenDoc.user);

    if (!user) {
        throw {
            statusCode: httpStatus.NOT_FOUND,
            message: 'User not found with the reset password token.',
        };
    }

    // Update the user password
    await userService.updateUserById(user?.id, { password: newPassword });

    // Send the verification email
    await EmailService.sendPasswordResetSuccessEmail(user?.name, user?.email);

    // Delete the reset password token
    await TokenModel.deleteMany({
        user: user?.id,
        type: tokenTypes.RESET_PASSWORD,
    });

    return sendServiceResponse(httpStatus.OK, 'Password reset successful.', {});
};

const verifyEmail = async verifyEmailToken => {
    const verifyEmailTokenDoc = await tokenService.verifyToken(
        verifyEmailToken,
        tokenTypes.VERIFY_EMAIL
    );
    const userDetails = await userService.getUserById(
        verifyEmailTokenDoc?.serviceData?.user
    );

    // Check if the user exists with the verified email token
    if (!userDetails) {
        throw {
            statusCode: httpStatus.FORBIDDEN,
            message: 'User not found with the verify email token.',
        };
    }

    // Delete the verify email token
    await TokenModel.deleteMany({
        user: userDetails?.id,
        type: tokenTypes.VERIFY_EMAIL,
    });

    // Update the user email verification status
    await userService.updateUserById(userDetails?.id, {
        isEmailVerified: true,
    });

    // Send the verification email
    await EmailService.sendEmailVerificationSuccessEmail(
        userDetails?.name,
        userDetails?.email
    );

    return sendServiceResponse(
        httpStatus.OK,
        'Email verification successful.',
        {}
    );
};

const AuthServices = {
    loginUserWithEmailAndPassword,
    logout,
    refreshAuth,
    resetPassword,
    verifyEmail,
};

export default AuthServices;
