import httpStatus from 'http-status';

import UserModel from './user.model.js';
import GoogleDriveFileOperations from '../../utils/GoogleDriveFileOperations.js';
import TokenService from '../token/token.service.js';

import ServerError from '../../utils/serverError.js';
import mongodbAggregationPipelineHelpers from '../../utils/mongodbAggregationPipelineHelpers.js';
import RoleModel from '../role/role.model.js';
import sendServiceResponse from '../../utils/sendServiceResponse.js';
import newServiceErrorHandler from '../../utils/newServiceErrorHandler.js';

/**
 * Create a user
 * @returns {Promise<User>}
 * @param sessionUser
 * @param registerData
 * @param file
 */
const createUser = async (sessionUser, registerData, file) => {
    try {
        // if (await UserModel.isEmailTaken(registerData.email)) {
        //     throw new ServerError(
        //         httpStatus.BAD_REQUEST,
        //         'Email already taken'
        //     );
        // }

        let pictureData = {};

        if (file) {
            pictureData = await GoogleDriveFileOperations.uploadFile(file);

            if (pictureData instanceof Error) {
                return {
                    serviceSuccess: false,
                    serviceStatus: httpStatus.INTERNAL_SERVER_ERROR,
                    serviceMessage: 'Failed to upload picture to Google Drive.',
                    serviceData: {},
                };
            }
        }

        const newUserDetails = await UserModel.create({
            ...registerData,
            picture: pictureData ? pictureData : null,
            createdBy: sessionUser?._id,
        });

        // Convert the Mongoose document to a plain JavaScript object
        let newUser = newUserDetails.toObject();

        // Remove the password field from the object
        delete newUser.password;

        const { serviceData } = await TokenService.generateAuthTokens(newUser);

        return {
            serviceSuccess: true,
            serviceStatus: newUser ? httpStatus.CREATED : httpStatus.NOT_FOUND,
            serviceMessage: newUser
                ? 'User created successfully.'
                : 'Could not create user.',
            serviceData: {
                ...newUser,
                token: serviceData,
            },
        };
    } catch (error) {
        return {
            serviceSuccess: false,
            serviceStatus: httpStatus.INTERNAL_SERVER_ERROR,
            serviceMessage: 'Failed to create user.',
            serviceData: {},
        };
    }
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
    const users = await UserModel.paginate(filter, options);
    return users;
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
