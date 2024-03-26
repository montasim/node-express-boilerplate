import moment from 'moment';
import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';

import sendServiceResponse from '../../utils/sendServiceResponse.js';
import processFailedLoginAttempt from '../../utils/processFailedLoginAttempt.js';
import processSuccessfulLogin from '../../utils/processSuccessfulLogin.js';
import excludeSensitiveFields from '../../utils/excludeSensitiveFields.js';
import checkAccountLockStatus from '../../utils/checkAccountLockStatus.js';

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

    // Check if the account is locked
    await checkAccountLockStatus(userDetails);

    // Check if the user password matches the hashed password
    const passwordMatch = await bcrypt.compare(password, userDetails?.password);

    // Check if the password is correct
    if (!passwordMatch) {
        // Process failed login attempt and possibly lock an account
        await processFailedLoginAttempt(userDetails);
    } else {
        // Process successful login
        await processSuccessfulLogin(userDetails);
    }

    // Generate auth tokens
    const token = await TokenService.generateAuthTokens(userDetails);

    // Convert the Mongoose document to a plain JavaScript object
    let userData = userDetails?.toObject();

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

    // Find the refresh token document and delete it
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

    // Return a successful response
    return sendServiceResponse(httpStatus.OK, 'Logout successful.', {});
};

const refreshAuth = async refreshToken => {
    // Verify if refreshToken is provided
    const refreshTokenDoc = await TokenModel.findOne({
        token: refreshToken,
        type: tokenTypes.REFRESH,
    });

    // Find the user with the refresh token
    const userDetails = await UserModel.findOne({ id: refreshTokenDoc?.user });

    // Check if the user exists with the refresh token
    if (!userDetails) {
        throw {
            statusCode: httpStatus.NOT_FOUND,
            message: 'User not found with the refresh token.',
        };
    }

    // Check if the account is locked
    await checkAccountLockStatus(userDetails);

    // Delete the refresh token
    await TokenModel.findOneAndDelete({ token: refreshToken });

    // Generate new auth tokens
    const newAuthToken = await tokenService.generateAuthTokens(userDetails);

    // Return the new auth token
    return sendServiceResponse(
        httpStatus.OK,
        'Refresh successful.',
        newAuthToken
    );
};

const resetPassword = async (resetPasswordToken, newPassword) => {
    // Reset password token verification
    const resetPasswordTokenDoc = await tokenService.verifyToken(
        resetPasswordToken,
        tokenTypes.RESET_PASSWORD
    );

    // Find the user with the reset password token
    const userDetails = await userService.getUserById(
        resetPasswordTokenDoc.user
    );

    // Check if the user exists with the reset password token
    if (!userDetails) {
        throw {
            statusCode: httpStatus.NOT_FOUND,
            message: 'User not found with the reset password token.',
        };
    }

    // Check if the account is locked
    await checkAccountLockStatus(userDetails);

    // Update the user password
    await userService.updateUserById(userDetails?.id, {
        password: newPassword,
    });

    // Send the verification email
    await EmailService.sendPasswordResetSuccessEmail(
        userDetails?.name,
        userDetails?.email
    );

    // Delete the reset password token
    await TokenModel.deleteMany({
        user: userDetails?.id,
        type: tokenTypes.RESET_PASSWORD,
    });

    // Return a successful response
    return sendServiceResponse(httpStatus.OK, 'Password reset successful.', {});
};

const verifyEmail = async verifyEmailToken => {
    // Verify email token
    const verifyEmailTokenDoc = await tokenService.verifyToken(
        verifyEmailToken,
        tokenTypes.VERIFY_EMAIL
    );

    // Find the user with the verified email token
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

    // Check if the account is locked
    await checkAccountLockStatus(userDetails);

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

    // Return a successful response
    return sendServiceResponse(
        httpStatus.OK,
        'Email verification successful.',
        {}
    );
};

const deleteExpiredTokens = async userDetails => {
    // Retrieve all associated refresh tokens
    const tokenQuery = {
        user: userDetails.id,
        type: tokenTypes.REFRESH,
        blacklisted: false,
    };
    const tokens = await TokenService.findTokenWithQuery(tokenQuery);
    const currentTime = moment.utc();
    const expiredTokens = tokens?.filter(token =>
        moment(token?.expires).isBefore(currentTime)
    );

    // Delete expired tokens if any
    if (expiredTokens?.length > 0) {
        const expiredTokensList = expiredTokens?.map(token => token?.token);

        await TokenService.deleteTokensByIds(expiredTokensList);
    }

    return { tokens, expiredTokens };
};

const AuthServices = {
    loginUserWithEmailAndPassword,
    logout,
    refreshAuth,
    resetPassword,
    verifyEmail,
    deleteExpiredTokens,
};

export default AuthServices;
