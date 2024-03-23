import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import moment from 'moment';

import config from '../../../config/config.js';
import userService from '../../user/user.service.js';
import TokenModel from './token.model.js';
import tokenModel from './token.model.js';
import tokenTypes from '../../../config/tokens.config.js';
import EmailService from '../../email/email.service.js';

import ServerError from '../../../utils/serverError.js';

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
    return await TokenModel.create({
        token,
        user: userId,
        expires: expires.toDate(),
        type,
        blacklisted,
    });
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
    const payload = jwt.verify(token, config.jwt.secret);
    const tokenDetails = await TokenModel.findOne({
        token,
        type,
        user: payload?.sub,
        blacklisted: false,
    });

    if (!tokenDetails) {
        throw new Error('Token not found');
    }

    return tokenDetails;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async user => {
    const accessTokenExpires = moment().add(
        config.jwt.accessExpirationMinutes,
        'minutes'
    );
    const accessToken = generateToken(
        user?.id,
        accessTokenExpires,
        tokenTypes.ACCESS
    );

    const refreshTokenExpires = moment().add(
        config.jwt.refreshExpirationDays,
        'days'
    );
    const refreshToken = generateToken(
        user?.id,
        refreshTokenExpires,
        tokenTypes.REFRESH
    );

    await saveToken(
        refreshToken,
        user?.id,
        refreshTokenExpires,
        tokenTypes.REFRESH
    );

    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate(),
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires.toDate(),
        },
    };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async email => {
    const userDetails = await userService.getUserByEmail(email);

    if (!userDetails) {
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
        userDetails?.id,
        expires,
        tokenTypes.RESET_PASSWORD
    );

    await saveToken(
        resetPasswordToken,
        userDetails?.id,
        expires,
        tokenTypes.RESET_PASSWORD
    );

    await EmailService.sendResetPasswordEmail(email, resetPasswordToken);

    return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {User} userId
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async userId => {
    const expires = moment().add(
        config.jwt.verifyEmailExpirationMinutes,
        'minutes'
    );
    const verifyEmailToken = generateToken(
        userId,
        expires,
        tokenTypes.VERIFY_EMAIL
    );

    await saveToken(verifyEmailToken, userId, expires, tokenTypes.VERIFY_EMAIL);

    return verifyEmailToken;
};

const findTokenWithQuery = async query => {
    return await tokenModel.find(query);
};

const TokenService = {
    generateToken,
    saveToken,
    verifyToken,
    generateAuthTokens,
    generateResetPasswordToken,
    generateVerifyEmailToken,
    findTokenWithQuery,
};

export default TokenService;
