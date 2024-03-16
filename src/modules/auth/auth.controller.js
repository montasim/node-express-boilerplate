import httpStatus from 'http-status';

import catchAsync from '../../utils/catchAsync.js';

import AuthServices from './auth.service.js';
import TokenService from '../token/token.service.js';
import UserService from '../user/user.service.js';
import EmailService from '../email/email.service.js';

const register = catchAsync(async (req, res) => {
    const user = await UserService.createUser(req.body);
    const tokens = await TokenService.generateAuthTokens(user);
    res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const user = await AuthServices.loginUserWithEmailAndPassword(
        email,
        password
    );
    const tokens = await TokenService.generateAuthTokens(user);
    res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
    await AuthServices.logout(req.body.refreshToken);
    res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
    const tokens = await AuthServices.refreshAuth(req.body.refreshToken);
    res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
    const resetPasswordToken = await TokenService.generateResetPasswordToken(
        req.body.email
    );
    await EmailService.sendResetPasswordEmail(
        req.body.email,
        resetPasswordToken
    );
    res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
    await AuthServices.resetPassword(req.query.token, req.body.password);
    res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
    const verifyEmailToken = await TokenService.generateVerifyEmailToken(
        req.user
    );
    await EmailService.sendVerificationEmail(req.user.email, verifyEmailToken);
    res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
    await AuthServices.verifyEmail(req.query.token);
    res.status(httpStatus.NO_CONTENT).send();
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
