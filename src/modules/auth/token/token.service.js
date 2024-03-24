/**
 * @fileoverview Token Service for user authentication and authorization in a Node.js Express API with MongoDB.
 *
 * This service module provides a comprehensive set of functions to generate, save, verify, and manage tokens
 * for various purposes, including user authentication (access and refresh tokens), password reset, and email verification.
 * Using JSON Web Tokens (JWT) and moment.js for time calculations, the service facilitates secure and efficient
 * user management by leveraging MongoDB for token storage and management.
 *
 * The core functionalities include:
 * - Generating JWTs for different purposes (authentication, password reset, email verification).
 * - Saving tokens to MongoDB with associated user information and metadata (expiration, type, blacklisted status).
 * - Verifying tokens against secrets and database records for authenticity and validity.
 * - Generating combined authentication tokens (access and refresh) for user sessions.
 * - Creating and managing tokens for password reset flows, including email communication.
 * - Generating tokens for email verification processes to ensure user email authenticity.
 * - Supporting generic token queries and bulk deletion operations for efficient token management.
 *
 * The service relies on external configurations for token secrets and expiration settings, and it interfaces
 * with other services (e.g., User Service, Email Service) for comprehensive user account and communication management.
 * This service is integral to securing API endpoints and implementing robust user authentication and authorization mechanisms.
 */

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
 * Generates a JSON Web Token (JWT) for user authentication and authorization.
 *
 * This function constructs a JWT with a payload
 * that includes the user's unique identifier,
 * the current timestamp as the issued-at time,
 * the token's expiration time, and the token's type
 * (e.g., access, refresh).
 * It then signs the token with a provided secret key.
 *
 * @param {string} userId The unique identifier of the user.
 * @param {moment.Moment} expirationMoment A moment object representing the expiration date and time of the token.
 * @param {string} tokenType The type of the token, indicating its purpose (e.g., 'access', 'refresh').
 * @param {string} secretKey The secret key used to sign the token.
 * This should be passed explicitly to avoid reliance on global state.
 * @returns {string} The signed JWT, as a string, ready to be used for securing API requests.
 * @example
 * // Generate an access token for a user that expires in 1 hour
 * const userId = 'user123';
 * const expirationMoment = moment().add(1, 'hours');
 * const tokenType = 'access';
 * const secretKey = 'your_secret_key';
 * const token = generateAuthToken(userId, expirationMoment, tokenType, secretKey);
 * console.log(token);
 */
function generateAuthToken(
    userId,
    expirationMoment,
    tokenType,
    secretKey = config.jwt.secret
) {
    // Construct the payload for the JWT
    const payload = {
        sub: userId,
        iat: moment().unix(),
        exp: expirationMoment.unix(),
        type: tokenType,
    };

    // Return the sign the token with the secret key
    return jwt.sign(payload, secretKey);
}

/**
 * Asynchronously saves a token to the database with associated user information and metadata.
 *
 * This function is designed for use within a Node.js Express API that interacts with a MongoDB database,
 * allowing for the storage of tokens for purposes such as authentication, authorization, or password reset mechanisms.
 * The token is saved with its associated user ID, expiration date, type (e.g., access, refresh), and a flag indicating
 * whether the token is blocklisted.
 *
 * @param {string} token The token string to be saved.
 * @param {string} userId The unique identifier of the user to whom the token belongs.
 * @param {moment.Moment} expires A moment.js object representing the expiration time of the token. This will be converted to a JavaScript Date object for storage.
 * @param {string} type The type of the token, indicating its purpose (e.g., 'access', 'refresh', 'reset').
 * @param {boolean} [blacklisted=false] A boolean indicating whether the token is blocklisted. Blacklisted tokens are considered invalid for use even before their expiration. Defaults to false.
 * @returns {Promise<Object>} A promise that resolves to the MongoDB document representing the saved token.
 * @example
 * // Save a new access token for a user
 * const token = 'your_token_string';
 * const userId = 'user123';
 * const expires = moment().add(1, 'hours'); // Token expires in 1 hour
 * const type = 'access';
 * saveToken(token, userId, expires, type)
 *   .then(savedToken => {
 *     console.log('Token saved:', savedToken);
 *   })
 *   .catch(error => {
 *     console.error('Error saving token:', error);
 *   });
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
    // Save the token to the database
    return await TokenModel.create({
        token,
        user: userId,
        expires: expires.toDate(),
        type,
        blacklisted,
    });
};

/**
 * Asynchronously verifies a provided JWT against a secret,
 * then checks the token's existence and status in the database.
 *
 * This function is intended
 * for validating tokens used in a Node.js Express application with MongoDB.
 * It first decodes and verifies the token using a secret to ensure it's
 * valid and has not been tampered with. Then, it queries the database to
 * check the token's existence, type, associated user, and whether it has
 * been blacklisted. This process helps in authenticating and authorizing users
 * by validating the tokens they present.
 *
 * @param {string} token The JWT string that needs to be verified.
 * @param {string} type The expected type of the token (e.g., 'access', 'refresh'),
 * which is used to validate the token's intended purpose.
 * @returns {Promise<Object>} A promise
 * that resolves to the token's details from the database
 * if the token is valid and not blacklisted.
 * @throws {Error} If the token is invalid, has been tampered with, is not found in the database,
 * or is blacklisted, an error is thrown.
 * @example
 * verifyToken('your_jwt_token', 'access')
 *   .then(tokenDetails => {
 *     console.log('Token is valid:', tokenDetails);
 *   })
 *   .catch(error => {
 *     console.error('Token verification failed:', error);
 *   });
 */
const verifyToken = async (token, type) => {
    // Verify the token
    const payload = jwt.verify(token, config.jwt.secret);

    // Find the token in the database
    const tokenDetails = await TokenModel.findOne({
        token,
        type,
        user: payload?.sub,
        blacklisted: false,
    });

    // If the token is not found, throw an error
    if (!tokenDetails) {
        throw new Error('Token not found');
    }

    // Return the token details
    return tokenDetails;
};

/**
 * Asynchronously generates authentication tokens for a user, including an access token and a refresh token.
 *
 * The access token is short-lived and used for authenticating most API requests. The refresh token is longer-lived,
 * stored in the database, and used to generate new access tokens once they expire. This function handles the creation
 * and persistence of these tokens, leveraging moment.js for calculating expiration times based on application
 * configuration settings.
 *
 * @param {Object} user The user object for whom the tokens are being generated. The object must contain the user's ID.
 * @returns {Promise<{access: {token: string, expires: Date}, refresh: {token: string, expires: Date}}>} An object containing the generated access and refresh tokens along with their respective expiration times.
 * @example
 * const user = { id: 'user123' };
 * generateAuthTokens(user)
 *   .then(tokens => {
 *     console.log('Access Token:', tokens.access.token);
 *     console.log('Refresh Token:', tokens.refresh.token);
 *   })
 *   .catch(error => {
 *     console.error('Error generating tokens:', error);
 *   });
 */
const generateAuthTokens = async user => {
    // Generate access token expiration time
    const accessTokenExpires = moment().add(
        config.jwt.accessExpirationMinutes,
        'minutes'
    );

    // Generate access token
    const accessToken = generateAuthToken(
        user?.id,
        accessTokenExpires,
        tokenTypes.ACCESS
    );

    // Generate refresh token expiration time
    const refreshTokenExpires = moment().add(
        config.jwt.refreshExpirationDays,
        'days'
    );

    // Generate refresh token
    const refreshToken = generateAuthToken(
        user?.id,
        refreshTokenExpires,
        tokenTypes.REFRESH
    );

    // Save refresh token
    await saveToken(
        refreshToken,
        user?.id,
        refreshTokenExpires,
        tokenTypes.REFRESH
    );

    // Return access and refresh tokens
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
 * Asynchronously generates a reset password token for a user identified by their email address.
 *
 * This function performs several critical steps in the password reset process:
 * 1. It searches for the user in the database using their email address.
 * 2. If the user exists, it generates a token that will be used for resetting the password. This token has a configurable expiration time.
 * 3. It saves this token to the database, associating it with the user's account.
 * 4. Finally, it sends an email to the user with instructions on how to reset their password, including the token.
 *
 * If any step in this process fails (e.g., the user is not found), the function will throw an appropriate error.
 *
 * @param {string} email The email address of the user who has requested a password reset.
 * @returns {Promise<string>} A promise that resolves to the reset password token.
 * @throws {ServerError} Throws a ServerError with a 404 status if no user is found with the provided email.
 * @example
 * generateResetPasswordToken('user@example.com')
 *   .then(token => {
 *     console.log('Reset password token generated:', token);
 *   })
 *   .catch(error => {
 *     console.error('Error generating reset password token:', error);
 *   });
 */
const generateResetPasswordToken = async email => {
    // Find the user with the email
    const userDetails = await userService.getUserByEmail(email);

    // If the user is not found, throw an error
    if (!userDetails) {
        throw new ServerError(
            httpStatus.NOT_FOUND,
            'No users found with this email'
        );
    }

    // Generate reset password token expiration time
    const resetPasswordTokenExpires = moment().add(
        config.jwt.resetPasswordExpirationMinutes,
        'minutes'
    );

    // Generate reset password token
    const resetPasswordToken = generateAuthToken(
        userDetails?.id,
        resetPasswordTokenExpires,
        tokenTypes.RESET_PASSWORD
    );

    // Save reset password token
    await saveToken(
        resetPasswordToken,
        userDetails?.id,
        resetPasswordTokenExpires,
        tokenTypes.RESET_PASSWORD
    );

    // Send reset password email
    await EmailService.sendResetPasswordEmail(email, resetPasswordToken);

    // Return the reset password token
    return resetPasswordToken;
};

/**
 * Asynchronously generates a token used for email verification for a given user.
 *
 * This function is a crucial part of the email verification flow. It creates a token that users must present to verify their email address. The process involves:
 * 1. Calculating an expiration time for the token based on application configuration.
 * 2. Generating the token itself with the user's ID and the specified expiration.
 * 3. Saving this token to the database, associating it specifically for email verification purposes.
 *
 * This token can then be included in an email verification link sent to the user. Once the user follows the link, the application can verify the token, thus confirming the user's email address.
 *
 * @param {string} userId The unique identifier of the user for whom the verification token is generated.
 * @returns {Promise<string>} A promise that resolves to the email verification token.
 * @example
 * generateVerifyEmailToken('12345')
 *   .then(token => {
 *     console.log('Email verification token generated:', token);
 *     // The token can now be sent to the user in an email for verification purposes
 *   })
 *   .catch(error => {
 *     console.error('Error generating email verification token:', error);
 *   });
 */
const generateVerifyEmailToken = async userId => {
    // Generate verify email token expiration time
    const verifyEmailTokenExpires = moment().add(
        config.jwt.verifyEmailExpirationMinutes,
        'minutes'
    );

    // Generate verify email token
    const verifyEmailToken = generateAuthToken(
        userId,
        verifyEmailTokenExpires,
        tokenTypes.VERIFY_EMAIL
    );

    // Save verify email token
    await saveToken(
        verifyEmailToken,
        userId,
        verifyEmailTokenExpires,
        tokenTypes.VERIFY_EMAIL
    );

    // Return the verified email token
    return verifyEmailToken;
};

/**
 * Asynchronously retrieves tokens from the database matching a specified query.
 *
 * This generic function allows for flexible retrieval of tokens based on various criteria,
 * encapsulated within the `query` object.
 * It's designed
 * to interact with a MongoDB database using Mongoose or a similar ODM.
 * The function can be used to find tokens by user ID, token type,
 * expiration status, or any other criteria defined within the token model.
 * It's particularly useful in systems where tokens serve multiple purposes,
 * such as authentication, email verification, or password reset,
 * and need to be queried efficiently.
 *
 * @param {Object} query An object
 * representing the query criteria used to search for tokens in the database.
 * This could include user ID, token type, expiration date, etc.
 * @returns {Promise<Array>} A promise
 * that resolves to an array of token documents that match the query criteria.
 * If no tokens match the query, the promise resolves to an empty array.
 * @example
 * // Find all refresh tokens for a specific user
 * findTokenWithQuery({ user: 'userId123', type: 'refresh' })
 *   .then(tokens => {
 *     console.log('Found tokens:', tokens);
 *   })
 *   .catch(error => {
 *     console.error('Error finding tokens:', error);
 *   });
 */
const findTokenWithQuery = async query => {
    // Find the token with the query
    return await tokenModel.find(query);
};

/**
 * Asynchronously deletes tokens from the database based on a list of token IDs.
 *
 * This function is particularly useful for bulk deletion operations,
 * such as removing expired tokens to maintain database hygiene.
 * It operates by matching the provided token IDs against the `token`
 * field in the database and deleting any documents that match.
 * The operation uses the MongoDB `$in`
 * query operator to find all tokens whose IDs are listed in the `expiredTokens`
 * array and removes them in a single query.
 * This method ensures efficient database operation
 * and is crucial for systems where token validity is time-sensitive
 * or where token cleanup is periodically required.
 *
 * @param {Array<string>} expiredTokens An array of token IDs that should be deleted from the database.
 * @returns {Promise<Object>} A promise that resolves to the result of the deletion operation,
 * typically including information such as the number of documents removed.
 * @example
 * // Delete a list of expired token IDs
 * deleteTokensByIds(['token1', 'token2', 'token3'])
 *   .then(result => {
 *     console.log(`${result.deletedCount} tokens were deleted.`);
 *   })
 *   .catch(error => {
 *     console.error('Error deleting tokens:', error);
 *   });
 */
const deleteTokensByIds = async expiredTokens => {
    // Delete the tokens with the ids
    return await tokenModel.deleteMany({ token: { $in: expiredTokens } });
};

const TokenService = {
    generateAuthToken,
    saveToken,
    verifyToken,
    generateAuthTokens,
    generateResetPasswordToken,
    generateVerifyEmailToken,
    findTokenWithQuery,
    deleteTokensByIds,
};

export default TokenService;
