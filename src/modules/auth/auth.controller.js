import httpStatus from 'http-status';

import asyncErrorHandler from '../../utils/asyncErrorHandler.js';
import sendControllerResponse from '../../utils/sendControllerResponse.js';

import AuthServices from './auth.service.js';
import TokenService from './token/token.service.js';
import UserService from '../user/user.service.js';
import EmailService from '../email/email.service.js';
import CustomValidation from '../../validations/custom.validation.js';

const register = async (req, res) => {
    const requestStartTime = Date.now(); // Get the request start time
    const { sessionUser, ...registerData } = req.body;
    const file = req.file || null;

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
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                status: httpStatus.BAD_REQUEST,
                message: fileValidationResult,
                data: {},
            });
        }
    }

    await sendControllerResponse(
        req,
        res,
        requestStartTime,
        UserService.createUser,
        [sessionUser, registerData, file],
        'AuthController.register()'
    );
};

const login = async (req, res) => {
    const requestStartTime = Date.now(); // Get the request start time
    const { email, password } = req.body;

    await sendControllerResponse(
        req,
        res,
        requestStartTime,
        AuthServices.loginUserWithEmailAndPassword,
        [email, password],
        'AuthController.login()'
    );
};

const logout = async (req, res) => {
    const requestStartTime = Date.now(); // Get the request start time
    const { refreshToken } = req.body;

    await sendControllerResponse(
        req,
        res,
        requestStartTime,
        AuthServices.logout,
        [refreshToken],
        'AuthController.logout()'
    );
};

const refreshTokens = async (req, res) => {
    const requestStartTime = Date.now(); // Get the request start time
    const { refreshToken } = req.body;

    await sendControllerResponse(
        req,
        res,
        requestStartTime,
        AuthServices.refreshAuth,
        [refreshToken],
        'AuthController.refreshTokens()'
    );
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
        req.user
    );

    await EmailService.sendVerificationEmail(req.user.email, verifyEmailToken);

    res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = async (req, res) => {
    const requestStartTime = Date.now(); // Get the request start time
    const { token } = req.query;

    await sendControllerResponse(
        req,
        res,
        requestStartTime,
        AuthServices.verifyEmail,
        [token],
        'AuthController.verifyEmail()'
    );
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
