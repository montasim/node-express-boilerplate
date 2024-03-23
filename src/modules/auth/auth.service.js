import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';

import sendServiceResponse from '../../utils/sendServiceResponse.js';

import tokenService from './token/token.service.js';
import userService from '../user/user.service.js';
import TokenService from './token/token.service.js';
import TokenModel from './token/token.model.js';
import tokenTypes from '../../config/tokens.config.js';
import RoleAggregationPipeline from './role/role.pipeline.js';
import RoleModel from './role/role.model.js';
import UserModel from '../user/user.model.js';
import config from '../../config/config.js';
import EmailService from '../email/email.service.js';

const loginUserWithEmailAndPassword = async (email, password) => {
    const userDetails = await userService.getUserByEmail(email);

    // Check if the user exists and the email is correct
    if (!userDetails || userDetails?.email !== email) {
        throw {
            statusCode: httpStatus.UNAUTHORIZED,
            message: 'Wrong email or password',
        };
    }

    const passwordMatch = await bcrypt.compare(password, userDetails?.password);

    // Check if the password is correct
    if (!passwordMatch) {
        // Send the verification email
        await EmailService.sendFailedLoginAttemptsEmail(
            userDetails?.name,
            userDetails?.email
        );

        throw {
            statusCode: httpStatus.UNAUTHORIZED,
            message: 'Wrong email or password',
        };
    }

    const tokenQuery = {
        user: userDetails?.id,
        type: tokenTypes.REFRESH,
        blacklisted: false,
    };
    const tokenDetails = await TokenService.findTokenWithQuery(tokenQuery);

    // Check if the user has more than 3 active sessions
    if (tokenDetails?.length > config.auth.activeSessions) {
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
    delete userData?._id;
    delete userData?.__v;
    delete userData?.password;
    delete userData?.role;

    // Return the user data with the role and token
    return sendServiceResponse(
        token ? httpStatus.OK : httpStatus.UNAUTHORIZED,
        token ? 'Login successful.' : 'Invalid email or password',
        {
            ...userData,
            role: populatedPermission[0],
            token,
        }
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
