import httpStatus from 'http-status';

import UserModel from './user.model.js';
import GoogleDriveFileOperations from '../../utils/GoogleDriveFileOperations.js';
import TokenService from '../auth/token/token.service.js';

import sendServiceResponse from '../../utils/sendServiceResponse.js';
import newServiceErrorHandler from '../../utils/newServiceErrorHandler.js';

import RoleModel from '../auth/role/role.model.js';
import RoleAggregationPipeline from '../auth/role/role.pipeline.js';
import UserAggregationPipeline from './user.pipeline.js';
import UserPipeline from './user.pipeline.js';

import ServerError from '../../utils/serverError.js';

const createUser = async (registerData, file) => {
    try {
        // Check if the email already exists
        const checkIfEmailExists = await UserModel.isEmailTaken(
            registerData.email
        );

        // If the email already exists, throw an error
        if (checkIfEmailExists) {
            throw {
                statusCode: httpStatus.BAD_REQUEST,
                message: 'Email already taken. Please use a different email.',
            };
        }

        let pictureData = {};

        // If a file is provided, upload the file to Google Drive
        if (file) {
            pictureData = await GoogleDriveFileOperations.uploadFile(file);
            if (pictureData instanceof Error) {
                throw {
                    statusCode: httpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Failed to upload picture to Google Drive.',
                };
            }
        }

        // Find the default role
        let defaultRole = await RoleModel.findOne({ name: 'Default' });

        // If the default role does not exist, create it
        if (!defaultRole) {
            defaultRole = await RoleModel.create({
                name: 'Default',
                isActive: true,
                createdBy: 'system-20240317230608-000000001',
            });
        }

        // Ensure the default role was either found or created successfully
        if (!defaultRole) {
            throw {
                statusCode: httpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to assign a default role.',
            };
        }

        // Create the user with the default role
        const newUserDetails = await UserModel.create({
            ...registerData,
            role: defaultRole.id,
            picture: pictureData || null,
        });

        // Populate the role details for the response
        const roleAggregationPipeline = RoleAggregationPipeline.getRole(
            defaultRole.id
        );
        const populatedRoleDetails = await RoleModel.aggregate(
            roleAggregationPipeline
        );

        // If the user creation fails for any reason, this check is somewhat redundant
        // because `create` will throw an error rather than returning `null`.
        // However, it's kept here for consistency with your original error handling.
        if (!newUserDetails) {
            // If the user creation fails, delete the user from the database
            // await UserModel.findOneAndDelete(
            //     { id: newUserDetails.id } // Use the custom id field for matching
            // );

            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'Could not create user.',
            };
        }

        // Convert the user details to an object for further manipulation
        let newUser = newUserDetails.toObject();

        // Generate the auth tokens
        const { serviceData } = await TokenService.generateAuthTokens(newUser);

        // Remove the unwanted fields from the object
        delete newUser._id;
        delete newUser.__v;
        delete newUser.password;

        // If a picture was uploaded, remove the fileId and shareableLink from the object
        if (newUser.picture) {
            delete newUser.picture.fileId;
            delete newUser.picture.shareableLink;
        }

        // Attach role details to the newUser object
        newUser.role = populatedRoleDetails[0] || null;

        // Return the newly created user information along with auth tokens
        return sendServiceResponse(
            httpStatus.CREATED,
            'User created successfully.',
            {
                ...newUser,
                token: serviceData,
            }
        );
    } catch (error) {
        // Handle errors that might occur during the user creation process
        return newServiceErrorHandler(error);
    }
};

const queryUsers = async (filter, options) => {
    try {
        // Set the default match stage
        let matchStage = { $match: {} };

        // Check if the filter options are available
        if (filter) {
            if (filter.name) {
                // For partial match on the name field
                matchStage.$match.name = { $regex: filter.name, $options: 'i' };
            }
            if (filter.isActive !== undefined) {
                // For exact match on the isActive field
                matchStage.$match.isActive = filter.isActive === 'true';
            }
            if (filter.createdBy) {
                matchStage.$match.createdBy = filter.createdBy;
            }
            if (filter.updatedBy) {
                matchStage.$match.updatedBy = filter.updatedBy;
            }
            if (filter.createdAt) {
                const startOfDay = new Date(filter.createdAt);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(filter.createdAt);
                endOfDay.setHours(23, 59, 59, 999);
                matchStage.$match.createdAt = {
                    $gte: startOfDay,
                    $lte: endOfDay,
                };
            }
            if (filter.updatedAt) {
                const startOfDay = new Date(filter.updatedAt);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(filter.updatedAt);
                endOfDay.setHours(23, 59, 59, 999);
                matchStage.$match.updatedAt = {
                    $gte: startOfDay,
                    $lte: endOfDay,
                };
            }
        }

        // Sorting options
        let sortStage = { $sort: { createdAt: -1 } }; // Default sort if no sortBy provided

        // Check if the sortBy options are available
        if (options.sortBy) {
            const sortParts = options.sortBy.split(':');
            const sortField = sortParts[0];
            const sortOrder = sortParts[1] === 'desc' ? -1 : 1; // Default to ascending if not specified

            // Ensure only specific fields are sortable
            if (['name', 'createdAt', 'updatedAt'].includes(sortField)) {
                sortStage = { $sort: { [sortField]: sortOrder } };
            }
        }

        const limit = options.limit ? parseInt(options.limit, 10) : 10;
        const skip = options.page
            ? (parseInt(options.page, 10) - 1) * limit
            : 0;

        // Build the dynamic aggregation pipeline
        const aggregationPipeline = [
            matchStage,
            {
                $lookup: {
                    from: 'roles', // "roles" is the collection name for roles
                    localField: 'role',
                    foreignField: 'id',
                    as: 'role',
                },
            },
            {
                $unwind: {
                    path: '$role',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'users', // Assuming 'users' is the collection name for both createdBy and updatedBy
                    localField: 'createdBy',
                    foreignField: 'id',
                    as: 'createdBy',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'updatedBy',
                    foreignField: 'id',
                    as: 'updatedBy',
                },
            },
            {
                $project: {
                    _id: 0,
                    __v: 0,
                    password: 0, // Assuming you don't want to return these fields
                    // Adjust the fields here based on what you want to exclude or include
                    // For example, to not include some fields from populated documents:
                    'role._id': 0,
                    'role.__v': 0,
                },
            },
        ].filter(stage => Object.keys(stage).length); // Filter out empty stages

        // Fetch the permissions using the aggregation pipeline
        const permissions = await UserModel.aggregate(aggregationPipeline);

        // Check if the permissions array is empty
        if (permissions?.length === 0) {
            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'No users found.',
            };
        }

        const permissionsData = {
            total: permissions.length,
            limit: limit,
            page: options.page || 1,
            users: permissions,
        };

        // Send the permissions data
        return sendServiceResponse(
            httpStatus.OK,
            'Users found successfully.',
            permissionsData
        );
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const getUserById = async userId => {
    try {
        // Aggregation pipeline to fetch and populate the updated document
        const aggregationPipeline = UserPipeline.getUser(userId);

        const user = await UserModel.aggregate(aggregationPipeline);

        // Check if the populatedPermission query returned a document
        if (user?.length === 0) {
            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'User not found.',
            };
        }

        // Send the permission data
        return sendServiceResponse(
            httpStatus.OK,
            'User found successfully.',
            user[0]
        );
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const getUserByEmail = async email => {
    try {
        // Find the user by ID
        const user = await UserModel.findOne({ email: email });

        // Check if the user was found
        if (!user) {
            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'User not found.',
            };
        }

        // Assuming you have the role ID in the user document,
        // use the aggregation pipeline to fetch and populate role details.
        const roleAggregationPipeline = RoleAggregationPipeline.getRole(
            user.role
        ); // This assumes getRole accepts an ID and returns a pipeline
        const roleDetails = await RoleModel.aggregate(roleAggregationPipeline);

        // Convert the Mongoose document to a plain JavaScript object, if it's not already
        let userObj = user.toObject ? user.toObject() : user;

        // Attach the populated role details to the user object
        // Since the pipeline may return an array, attach the first result if it exists
        userObj.role = roleDetails.length > 0 ? roleDetails[0] : null;

        // Remove the unwanted fields from the user object
        delete userObj._id;
        delete userObj.__v;
        delete userObj.password;

        // If a picture was uploaded, remove the fileId and shareableLink from the object
        if (userObj.picture) {
            delete userObj.picture.fileId;
            delete userObj.picture.shareableLink;
        }

        // Send the user data
        return sendServiceResponse(
            httpStatus.OK,
            'User found successfully.',
            userObj
        );
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const updateUserById = async (userId, userData, file) => {
    try {
        // Find the user by ID
        const oldUserData = await UserModel.findOne({ id: userId });

        // Check if the user was found
        if (!oldUserData) {
            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'User not found.',
            };
        }

        // Assuming that initially, the data is the same
        let isDataSame = true;

        // Checking for changes in the userData
        for (const [key, value] of Object.entries(userData)) {
            if (JSON.stringify(oldUserData[key]) !== JSON.stringify(value)) {
                isDataSame = false;
                break;
            }
        }

        // Check if the data is the same
        if (isDataSame && !file) {
            throw {
                statusCode: httpStatus.BAD_REQUEST,
                message: 'No changes detected. Update not performed.',
            };
        }

        if (userData?.email && userData?.email !== oldUserData?.email) {
            // Check if the new email already exists
            const emailTaken = await UserModel.findOne({
                email: userData?.email,
            });

            // If the new email already exists and does not belong to the current user, throw an error
            if (emailTaken) {
                throw {
                    statusCode: httpStatus.BAD_REQUEST,
                    message:
                        'Email already taken. Please use a different email.',
                };
            }
        }

        // Handle picture update
        let pictureData = {};

        // If a file is provided, upload the file to Google Drive
        if (file) {
            pictureData = await GoogleDriveFileOperations.uploadFile(file);

            // Check if the picture upload failed
            if (pictureData instanceof Error) {
                throw {
                    statusCode: httpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Failed to upload picture to Google Drive.',
                };
            }

            // TODO: Remove the old picture from Google Drive

            // Update the picture data
            userData.picture = pictureData; // Assuming pictureData structure matches your UserModel
        }

        // Prepare the updated data
        const updateData = {
            ...userData,
            isEmailVerified: false,
            updatedBy: 'system-20240317230608-000000001', // Assuming you're passing the current user's ID
            updatedAt: new Date(),
        };

        // Update the permission using the custom permissionId
        const updatedUserDetails = await UserModel.findOneAndUpdate(
            { id: userId },
            updateData,
            { new: true }
        ).lean(); // .lean() converts the document to a plain JavaScript object

        // Check if the permission was updated
        if (!updatedUserDetails) {
            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'Failed to update permission. Please try again.',
            };
        }

        // Aggregation pipeline to fetch and populate the updated document
        const aggregationPipeline = UserAggregationPipeline.getUser(userId);

        // Fetch the updated permission using the aggregation pipeline
        const populatedPermission =
            await UserModel.aggregate(aggregationPipeline);

        // Check if the populatedPermission query returned a document
        if (!populatedPermission || populatedPermission?.length === 0) {
            throw {
                statusCode: httpStatus.OK,
                message: 'Permission updated but population failed.',
            };
        }

        // Remove sensitive information
        delete updatedUserDetails?._id;
        delete updatedUserDetails?.__v;
        delete updatedUserDetails?.password;

        // Remove picture file ID and shareable link if picture exists
        if (updatedUserDetails?.picture) {
            delete updatedUserDetails?.picture.fileId;
            delete updatedUserDetails?.picture.shareableLink;
        }

        console.log(populatedPermission[0]);

        // Return the updated user information
        return sendServiceResponse(
            httpStatus.OK,
            'User updated successfully.',
            populatedPermission[0]
        );
    } catch (error) {
        // Handle errors that might occur during the user creation process
        return newServiceErrorHandler(error);
    }
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
