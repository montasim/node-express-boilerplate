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

const loginUserWithEmailAndPassword = async (email, password) => {
    const userDetails = await userService.getUserByEmail(email);

    if (!userDetails || userDetails?.email !== email) {
        throw {
            statusCode: httpStatus.UNAUTHORIZED,
            message: 'Wrong email or password',
        };
    }

    const passwordMatch = await bcrypt.compare(password, userDetails.password);

    if (!passwordMatch) {
        throw {
            statusCode: httpStatus.UNAUTHORIZED,
            message: 'Wrong email or password',
        };
    }

    const token = await TokenService.generateAuthTokens(userDetails);

    // Convert the Mongoose document to a plain JavaScript object
    let userData = userDetails.toObject();

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
    delete userData._id;
    delete userData.__v;
    delete userData.password;
    delete userData.role;

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

    const user = await UserModel.findOne({ id: refreshTokenDoc.user });

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

    await userService.updateUserById(user.id, { password: newPassword });
    await TokenModel.deleteMany({
        user: user.id,
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
        verifyEmailTokenDoc.serviceData.user
    );

    if (!userDetails) {
        throw {
            statusCode: httpStatus.FORBIDDEN,
            message: 'User not found with the verify email token.',
        };
    }

    await TokenModel.deleteMany({
        user: userDetails.id,
        type: tokenTypes.VERIFY_EMAIL,
    });

    await userService.updateUserById(userDetails.id, {
        isEmailVerified: true,
    });

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
