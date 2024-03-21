import httpStatus from 'http-status';

import asyncErrorHandler from '../../utils/asyncErrorHandler.js';
import sendControllerResponse from '../../utils/sendControllerResponse.js';
import sendControllerErrorResponse from '../../utils/sendControllerErrorResponse.js';
import sendControllerSuccessResponse from '../../utils/sendControllerSuccessResponse.js';

import AuthServices from './auth.service.js';
import TokenService from './token/token.service.js';
import UserService from '../user/user.service.js';
import EmailService from '../email/email.service.js';
import CustomValidation from '../../validations/custom.validation.js';
import tokenTypes from '../../config/tokens.config.js';
import userService from '../user/user.service.js';
import ServerError from '../../utils/serverError.js';
import TokenModel from './token/token.model.js';

const register = async (req, res) => {
    try {
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
                    statusCode: httpStatus.BAD_REQUEST,
                    message: fileValidationResult,
                };
            }
        }

        // Create a new user
        const newUserData = await UserService.createUser(req.body, file);

        // Send the new permission data
        return sendControllerSuccessResponse(res, newUserData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'AuthController.register()'
        );
    }
};

const login = async (req, res) => {
    try {
        const loginData = await AuthServices.loginUserWithEmailAndPassword(
            req?.body?.email,
            req?.body?.password
        );

        return sendControllerSuccessResponse(res, loginData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'AuthController.login()'
        );
    }
};

const logout = async (req, res) => {
    try {
        const logoutData = await AuthServices.logout(req?.body?.refreshToken);

        return sendControllerSuccessResponse(res, logoutData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'AuthController.login()'
        );
    }
};

const refreshTokens = async (req, res) => {
    try {
        const refreshTokenData = await AuthServices.refreshAuth(
            req?.body?.refreshToken
        );

        return sendControllerSuccessResponse(res, refreshTokenData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'AuthController.refreshTokens()'
        );
    }
};

const forgotPassword = async (req, res) => {
    const requestStartTime = Date.now(); // Get the request start time
    const { email } = req.body;

    await sendControllerResponse(
        req,
        res,
        requestStartTime,
        TokenService.generateResetPasswordToken,
        [email],
        'AuthController.forgotPassword()'
    );
};

const resetPassword = async (req, res) => {
    const requestStartTime = Date.now(); // Get the request start time
    const { token } = req.query;
    const { password } = req.body;

    await sendControllerResponse(
        req,
        res,
        requestStartTime,
        AuthServices.resetPassword,
        [token, password],
        'AuthController.resetPassword()'
    );
};

const sendVerificationEmail = asyncErrorHandler(async (req, res) => {
    const verifyEmailToken = await TokenService.generateVerifyEmailToken(
        req.body.id
    );

    await EmailService.sendVerificationEmail(req.body.email, verifyEmailToken);

    res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = async (req, res) => {
    try {
        const verifyEmailTokenDoc = await TokenModel.findOne({
            token: req.params.token,
            type: tokenTypes.VERIFY_EMAIL,
        });

        console.log(verifyEmailTokenDoc);

        const user = await userService.getUserById(verifyEmailTokenDoc.user);

        console.log(user);

        if (!user) {
            throw new Error();
        }

        await TokenModel.deleteMany({
            user: user.id,
            type: tokenTypes.VERIFY_EMAIL,
        });

        await userService.updateUserById(user.id, { isEmailVerified: true });
    } catch (error) {
        throw new ServerError(
            httpStatus.UNAUTHORIZED,
            'Email verification failed'
        );
    }
};

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
