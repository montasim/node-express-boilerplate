import httpStatus from 'http-status';

import asyncErrorHandler from '../../utils/asyncErrorHandler.js';
import sendControllerResponse from '../../utils/sendControllerResponse.js';

import AuthServices from './auth.service.js';
import TokenService from './token/token.service.js';
import UserService from '../user/user.service.js';
import EmailService from '../email/email.service.js';
import CustomValidation from '../../validations/custom.validation.js';
import tokenTypes from '../../config/tokens.config.js';
import userService from '../user/user.service.js';
import TokenModel from './token/token.model.js';

const register = asyncErrorHandler(async (req, res) => {
    const file = req.file;

    // Perform file validation if a file is present
    if (file) {
        // Define dynamic file validation parameters
        const allowedExtensions = /jpeg|jpg|png|gif/;
        const maxSize = 5 * 1024 * 1024; // 5 MB

        // Perform file validation
        const fileValidationResult = CustomValidation.file(
            file,
            allowedExtensions,
            maxSize
        );

        if (fileValidationResult !== true) {
            throw {
                status: httpStatus.BAD_REQUEST,
                message: fileValidationResult,
            };
        }
    }

    // Create a new user
    const newUserData = await UserService.createUser(req.body, file);

    // Send the new permission data
    return sendControllerResponse(res, newUserData);
});

const login = asyncErrorHandler(async (req, res) => {
    const loginData = await AuthServices.loginUserWithEmailAndPassword(
        req?.body?.email,
        req?.body?.password
    );

    return sendControllerResponse(res, loginData);
});

const logout = asyncErrorHandler(async (req, res) => {
    const logoutData = await AuthServices.logout(req?.body?.refreshToken);

    return sendControllerResponse(res, logoutData);
});

const refreshTokens = asyncErrorHandler(async (req, res) => {
    const refreshTokenData = await AuthServices.refreshAuth(
        req?.body?.refreshToken
    );

    return sendControllerResponse(res, refreshTokenData);
});

const forgotPassword = asyncErrorHandler(async (req, res) => {
    const email = req.body.email;
    const forgotPasswordData =
        await TokenService.generateResetPasswordToken(email);

    return sendControllerResponse(res, forgotPasswordData);
});

const resetPassword = asyncErrorHandler(async (req, res) => {
    const token = req.query.roken;
    const password = req.body.password;
    const forgotPasswordData = await AuthServices.resetPassword(
        token,
        password
    );

    return sendControllerResponse(res, forgotPasswordData);
});

const sendVerificationEmail = asyncErrorHandler(async (req, res) => {
    const verifyEmailToken = await TokenService.generateVerifyEmailToken(
        req.body.id
    );

    await EmailService.sendVerificationEmail(req.body.email, verifyEmailToken);

    res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = asyncErrorHandler(async (req, res) => {
    const verifyEmailTokenDoc = await TokenModel.findOne({
        token: req.params.token,
        type: tokenTypes.VERIFY_EMAIL,
    });

    const user = await userService.getUserById(verifyEmailTokenDoc.user);

    if (!user) {
        throw new Error();
    }

    await TokenModel.deleteMany({
        user: user?.id,
        type: tokenTypes.VERIFY_EMAIL,
    });

    await userService.updateUserById(user?.id, { isEmailVerified: true });
});

const AuthController = {
    register,
    login,
    logout,
    refreshTokens,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
};

export default AuthController;
