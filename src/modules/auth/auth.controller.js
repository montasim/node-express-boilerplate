import httpStatus from 'http-status';

import asyncErrorHandler from '../../utils/asyncErrorHandler.js';
import controllerErrorHandler from '../../utils/handleControllerError.js';
import fetchRequestMetadata from '../../utils/fetchRequestMetadata.js';
import generateRequestResponseMetadata from '../../utils/generateRequestResponseMetadata.js';
import prepareResponseData from '../../utils/prepareResponseData.js';

import AuthServices from './auth.service.js';
import TokenService from '../token/token.service.js';
import UserService from '../user/user.service.js';
import EmailService from '../email/email.service.js';

const register = async (req, res) => {
    const requestStartTime = Date.now(); // Get the request start time
    const { device, links, meta, ifNoneMatch, ifModifiedSince } =
        await fetchRequestMetadata(req);

    try {
        // Extracting the data from req.body
        const { sessionUser, ...registerData } = req.body;
        const file = req.file || null;

        const { serviceSuccess, serviceData, serviceMessage, serviceStatus } =
            await UserService.createUser(sessionUser, registerData, file);

        const responseMetaData = generateRequestResponseMetadata(
            requestStartTime,
            device,
            ifNoneMatch,
            ifModifiedSince
        );
        const responseData = prepareResponseData(
            serviceSuccess,
            serviceData,
            serviceMessage,
            serviceStatus,
            links,
            { ...meta, ...responseMetaData }
        );

        return res.status(responseData?.status).json(responseData);
    } catch (error) {
        return controllerErrorHandler(
            res,
            error,
            requestStartTime,
            device,
            links,
            meta,
            ifNoneMatch,
            ifModifiedSince,
            'UserController.createUser()'
        );
    }
};

const login = async (req, res) => {
    const requestStartTime = Date.now(); // Get the request start time
    const { device, links, meta, ifNoneMatch, ifModifiedSince } =
        await fetchRequestMetadata(req);

    try {
        // Extracting the data from req.body
        const { email, password } = req.body;

        const { serviceSuccess, serviceData, serviceMessage, serviceStatus } =
            await AuthServices.loginUserWithEmailAndPassword(email, password);

        const responseMetaData = generateRequestResponseMetadata(
            requestStartTime,
            device,
            ifNoneMatch,
            ifModifiedSince
        );
        const responseData = prepareResponseData(
            serviceSuccess,
            serviceData,
            serviceMessage,
            serviceStatus,
            links,
            { ...meta, ...responseMetaData }
        );

        return res.status(responseData?.status).json(responseData);
    } catch (error) {
        return controllerErrorHandler(
            res,
            error,
            requestStartTime,
            device,
            links,
            meta,
            ifNoneMatch,
            ifModifiedSince,
            'UserController.createUser()'
        );
    }
};

const logout = async (req, res) => {
    const requestStartTime = Date.now(); // Get the request start time
    const { device, links, meta, ifNoneMatch, ifModifiedSince } =
        await fetchRequestMetadata(req);

    try {
        // Extracting the data from req.body
        const { refreshToken } = req.body;

        const { serviceSuccess, serviceData, serviceMessage, serviceStatus } =
            await AuthServices.logout(refreshToken);

        const responseMetaData = generateRequestResponseMetadata(
            requestStartTime,
            device,
            ifNoneMatch,
            ifModifiedSince
        );
        const responseData = prepareResponseData(
            serviceSuccess,
            serviceData,
            serviceMessage,
            serviceStatus,
            links,
            { ...meta, ...responseMetaData }
        );

        return res.status(responseData?.status).json(responseData);
    } catch (error) {
        return controllerErrorHandler(
            res,
            error,
            requestStartTime,
            device,
            links,
            meta,
            ifNoneMatch,
            ifModifiedSince,
            'UserController.createUser()'
        );
    }
};

const refreshTokens = async (req, res) => {
    const requestStartTime = Date.now(); // Get the request start time
    const { device, links, meta, ifNoneMatch, ifModifiedSince } =
        await fetchRequestMetadata(req);

    try {
        // Extracting the data from req.body
        const { refreshToken } = req.body;

        const { serviceSuccess, serviceData, serviceMessage, serviceStatus } =
            await AuthServices.refreshAuth(refreshToken);

        const responseMetaData = generateRequestResponseMetadata(
            requestStartTime,
            device,
            ifNoneMatch,
            ifModifiedSince
        );
        const responseData = prepareResponseData(
            serviceSuccess,
            serviceData,
            serviceMessage,
            serviceStatus,
            links,
            { ...meta, ...responseMetaData }
        );

        return res.status(responseData?.status).json(responseData);
    } catch (error) {
        return controllerErrorHandler(
            res,
            error,
            requestStartTime,
            device,
            links,
            meta,
            ifNoneMatch,
            ifModifiedSince,
            'UserController.createUser()'
        );
    }
};

const forgotPassword = asyncErrorHandler(async (req, res) => {
    const requestStartTime = Date.now(); // Get the request start time
    const { device, links, meta, ifNoneMatch, ifModifiedSince } =
        await fetchRequestMetadata(req);

    try {
        // Extracting the data from req.body
        const { email } = req.body;

        const { serviceSuccess, serviceData, serviceMessage, serviceStatus } =
            await TokenService.generateResetPasswordToken(email);

        const responseMetaData = generateRequestResponseMetadata(
            requestStartTime,
            device,
            ifNoneMatch,
            ifModifiedSince
        );
        const responseData = prepareResponseData(
            serviceSuccess,
            serviceData,
            serviceMessage,
            serviceStatus,
            links,
            { ...meta, ...responseMetaData }
        );

        return res.status(responseData?.status).json(responseData);
    } catch (error) {
        return controllerErrorHandler(
            res,
            error,
            requestStartTime,
            device,
            links,
            meta,
            ifNoneMatch,
            ifModifiedSince,
            'UserController.createUser()'
        );
    }
});

const resetPassword = asyncErrorHandler(async (req, res) => {
    await AuthServices.resetPassword(req.query.token, req.body.password);
    res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = asyncErrorHandler(async (req, res) => {
    const verifyEmailToken = await TokenService.generateVerifyEmailToken(
        req.user
    );
    await EmailService.sendVerificationEmail(req.user.email, verifyEmailToken);
    res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = asyncErrorHandler(async (req, res) => {
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
