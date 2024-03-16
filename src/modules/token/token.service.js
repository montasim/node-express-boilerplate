import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import moment from 'moment';

import config from '../../config/config.js';
import userService from '../user/user.service.js';
import TokenModel from './token.model.js'; // Assuming Token is exported from index.js in the models folder
import { tokenTypes } from '../../config/tokens.js';

import ServerError from '../../utils/serverError.js';
import UserModel from '../user/user.model.js';
import GoogleDriveFileOperations from '../../utils/GoogleDriveFileOperations.js';

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
    const payload = {
        sub: userId,
        iat: moment().unix(),
        exp: expires.unix(),
        type,
    };

    return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
    const tokenDoc = await TokenModel.create({
        token,
        user: userId,
        expires: expires.toDate(),
        type,
        blacklisted,
    });

    return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
    const payload = jwt.verify(token, config.jwt.secret);
    const tokenDoc = await TokenModel.findOne({
        token,
        type,
        user: payload.sub,
        blacklisted: false,
    });

    if (!tokenDoc) {
        throw new Error('Token not found');
    }

    return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async user => {
    try {
        const accessTokenExpires = moment().add(
            config.jwt.accessExpirationMinutes,
            'minutes'
        );
        const accessToken = generateToken(
            user._id,
            accessTokenExpires,
            tokenTypes.ACCESS
        );

        const refreshTokenExpires = moment().add(
            config.jwt.refreshExpirationDays,
            'days'
        );
        const refreshToken = generateToken(
            user._id,
            refreshTokenExpires,
            tokenTypes.REFRESH
        );

        await saveToken(
            refreshToken,
            user._id,
            refreshTokenExpires,
            tokenTypes.REFRESH
        );

        const token = {
            access: {
                token: accessToken,
                expires: accessTokenExpires.toDate(),
            },
            refresh: {
                token: refreshToken,
                expires: refreshTokenExpires.toDate(),
            },
        };

        return {
            controllerSuccess: true,
            serviceStatus: httpStatus.CREATED,
            serviceMessage: 'Tokens generated successfully.',
            serviceData: token,
        };
    } catch (error) {
        return {
            controllerSuccess: false,
            serviceStatus: httpStatus.INTERNAL_SERVER_ERROR,
            serviceMessage: 'Failed to create user.',
            serviceData: {},
        };
    }
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async email => {
    const user = await userService.getUserByEmail(email);

    if (!user) {
        throw new ServerError(
            httpStatus.NOT_FOUND,
            'No users found with this email'
        );
    }

    const expires = moment().add(
        config.jwt.resetPasswordExpirationMinutes,
        'minutes'
    );
    const resetPasswordToken = generateToken(
        user.id,
        expires,
        tokenTypes.RESET_PASSWORD
    );

    await saveToken(
        resetPasswordToken,
        user.id,
        expires,
        tokenTypes.RESET_PASSWORD
    );

    return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async user => {
    const expires = moment().add(
        config.jwt.verifyEmailExpirationMinutes,
        'minutes'
    );
    const verifyEmailToken = generateToken(
        user.id,
        expires,
        tokenTypes.VERIFY_EMAIL
    );

    await saveToken(
        verifyEmailToken,
        user.id,
        expires,
        tokenTypes.VERIFY_EMAIL
    );

    return verifyEmailToken;
};

const TokenService = {
    generateToken,
    saveToken,
    verifyToken,
    generateAuthTokens,
    generateResetPasswordToken,
    generateVerifyEmailToken,
};

export default TokenService;
