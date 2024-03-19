import httpStatus from 'http-status';

import UserModel from './user.model.js';
import GoogleDriveFileOperations from '../../utils/GoogleDriveFileOperations.js';
import TokenService from '../auth/token/token.service.js';
import mongodbAggregationPipelineHelpers from '../../utils/mongodbAggregationPipelineHelpers.js';

import sendServiceResponse from '../../utils/sendServiceResponse.js';
import newServiceErrorHandler from '../../utils/newServiceErrorHandler.js';

import ServerError from '../../utils/serverError.js';

const createUser = async (registerData, file) => {
    try {
        const checkIfEmailExists = await UserModel.isEmailTaken(
            registerData.email
        );

        if (checkIfEmailExists) {
            throw {
                statusCode: httpStatus.BAD_REQUEST,
                message: 'Email already taken. Please use a different email.',
            };
        }

        let pictureData = {};

        if (file) {
            pictureData = await GoogleDriveFileOperations.uploadFile(file);

            if (pictureData instanceof Error) {
                throw {
                    statusCode: httpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Failed to upload picture to Google Drive.',
                };
            }
        }

        const newUserDetails = await UserModel.create({
            ...registerData,
            picture: pictureData ? pictureData : null,
        });

        // Convert the Mongoose document to a plain JavaScript object
        let newUser = newUserDetails.toObject();

        const { serviceData } = await TokenService.generateAuthTokens(newUser);

        // Remove the password field from the object
        delete newUser._id;
        delete newUser.__v;
        delete newUser.password;

        return sendServiceResponse(
            newUser ? httpStatus.CREATED : httpStatus.NOT_FOUND,
            newUser ? 'User created successfully.' : 'Could not create user.',
            {
                ...newUser,
                token: serviceData,
            }
        );
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const queryUsers = async (filter, options) => {
    try {
        const users = await UserModel.find();

        console.log('users', users);

        if (!users?.length > 0) {
            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'No users found.',
            };
        }

        return sendServiceResponse(
            httpStatus.OK,
            `${users?.length > 1 ? 'Users' : 'User'} found successfully.`,
            users
        );
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const getUserById = async userId => {
    try {
        // Aggregation pipeline to fetch and populate the updated document
        const aggregationPipeline =
            mongodbAggregationPipelineHelpers.createdByUpdatedByAggregationPipeline(
                userId
            );

        const user = await UserModel.aggregate(aggregationPipeline);

        // Check if the populatedRole query returned a document
        if (user?.length === 0) {
            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'User not found.',
            };
        }

        // Send the role data
        return sendServiceResponse(
            httpStatus.OK,
            'User found successfully.',
            user[0]
        );
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async email => {
    return UserModel.findOne({ email: email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new ServerError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (
        updateBody.email &&
        (await UserModel.isEmailTaken(updateBody.email, userId))
    ) {
        throw new ServerError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    Object.assign(user, updateBody);
    await user.save();
    return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async userId => {
    const user = await getUserById(userId);
    if (!user) {
        throw new ServerError(httpStatus.NOT_FOUND, 'User not found');
    }
    await user.remove();
    return user;
};

const UserService = {
    createUser,
    queryUsers,
    getUserById,
    getUserByEmail,
    updateUserById,
    deleteUserById,
};

export default UserService;
