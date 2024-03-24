import httpStatus from 'http-status';

import sendServiceResponse from '../../utils/sendServiceResponse.js';
import excludeSensitiveFields from '../../utils/excludeSensitiveFields.js';

import UserModel from './user.model.js';
import RoleModel from '../auth/role/role.model.js';
import GoogleDriveFileOperations from '../../utils/GoogleDriveFileOperations.js';
import TokenService from '../auth/token/token.service.js';
import RoleAggregationPipeline from '../auth/role/role.pipeline.js';
import EmailService from '../email/email.service.js';

import ServerError from '../../utils/serverError.js';

const createUser = async (registerData, file) => {
    // Check if the email already exists
    const checkIfEmailExists = await UserModel.isEmailTaken(registerData.email);

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
        role: defaultRole?.id,
        picture: pictureData || null,
    });

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
    const authTokens = await TokenService.generateAuthTokens(newUser);

    // Generate a new token for email verification
    const verifyEmailToken = await TokenService.generateVerifyEmailToken(
        newUser?.id
    );

    // Send the verification email
    await EmailService.sendRegistrationEmail(
        newUser?.name,
        newUser?.email,
        verifyEmailToken
    );

    // Aggregation pipeline to fetch and populate the updated document
    const aggregationPipeline = RoleAggregationPipeline.getRole(newUser?.role);

    // Fetch the updated permission using the aggregation pipeline
    const populatedRole = await RoleModel.aggregate(aggregationPipeline);

    // Check if the populatedPermission query returned a document
    if (!populatedRole || populatedRole?.length === 0) {
        throw {
            statusCode: httpStatus.OK,
            message: 'User creation successful but role population failed.',
        };
    }

    // Remove the password field from the object
    const fieldsToRemove = [
        '_id',
        '__v',
        'password',
        'role',
        'maximumLoginAttempts',
        'maximumResetPasswordAttempts',
        'maximumEmailVerificationAttempts',
        'maximumChangeEmailAttempts',
        'maximumChangePasswordAttempts',
    ];

    // Remove sensitive fields from userDetails
    const sanitizedUserDetails = excludeSensitiveFields(
        newUser,
        fieldsToRemove
    );

    // Create the response object
    const response = {
        ...sanitizedUserDetails, // Spread sanitized user details instead of original userDetails
        role: populatedRole[0], // Include role details
        token: authTokens, // Include token
    };

    // Return the newly created user information along with auth tokens
    return sendServiceResponse(
        httpStatus.CREATED,
        'User created successfully.',
        response
    );
};

const queryUsers = async (filter, options) => {
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
    const skip = options.page ? (parseInt(options.page, 10) - 1) * limit : 0;

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
                password: 0,
                role: 0,
                maximumLoginAttempts: 0,
                maximumResetPasswordAttempts: 0,
                maximumEmailVerificationAttempts: 0,
                maximumChangeEmailAttempts: 0,
                maximumChangePasswordAttempts: 0,
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
};

const getUserById = async userId => {
    // Find the user by ID
    const existingUser = await UserModel.findOne({ id: userId });

    if (!existingUser) {
        throw {
            statusCode: httpStatus.NOT_FOUND,
            message: 'User not found.',
        };
    }

    // Convert a Mongoose document to a JavaScript object for easier manipulation
    const userObject = existingUser.toObject();

    // Aggregation pipeline to fetch and populate the updated document
    const aggregationPipeline = RoleAggregationPipeline.getRole(
        userObject?.role
    );

    // Fetch the updated permission using the aggregation pipeline
    const populatedRole = await RoleModel.aggregate(aggregationPipeline);

    // Check if the populatedRole query returned a document
    if (!populatedRole || populatedRole?.length === 0) {
        throw {
            statusCode: httpStatus.OK,
            message: 'User found successfully but role population failed.',
        };
    }

    // Remove the password field from the object
    const fieldsToRemove = [
        '_id',
        '__v',
        'password',
        'role',
        'maximumLoginAttempts',
        'maximumResetPasswordAttempts',
        'maximumEmailVerificationAttempts',
        'maximumChangeEmailAttempts',
        'maximumChangePasswordAttempts',
    ];

    // Remove sensitive fields from userDetails
    const sanitizedUserDetails = excludeSensitiveFields(
        userObject,
        fieldsToRemove
    );

    // Create the response object
    const response = {
        ...sanitizedUserDetails, // Spread sanitized user details instead of original userDetails
        role: populatedRole[0], // Include role details
    };

    // Return the newly created user information along with auth tokens
    return sendServiceResponse(
        httpStatus.CREATED,
        'User found successfully.',
        response
    );
};

const getUserByEmail = async email => {
    return await UserModel.findOne({ email: email });
};

const updateUserById = async (userId, userData, file) => {
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
                message: 'Email already taken. Please use a different email.',
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

        // Check if the old picture exists
        if (oldUserData?.picture?.fileId) {
            // Remove the old picture from Google Drive
            await GoogleDriveFileOperations.deleteFile(
                oldUserData?.picture?.fileId
            );
        }

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
            message: 'Failed to update user. Please try again.',
        };
    }

    // Remove the password field from the object
    const fieldsToRemove = [
        '_id',
        '__v',
        'password',
        'maximumLoginAttempts',
        'maximumResetPasswordAttempts',
        'maximumEmailVerificationAttempts',
        'maximumChangeEmailAttempts',
        'maximumChangePasswordAttempts',
    ];

    // Remove sensitive fields from userDetails
    const sanitizedUserDetails = excludeSensitiveFields(
        updatedUserDetails,
        fieldsToRemove
    );

    // Remove picture file ID and shareable link if picture exists
    if (sanitizedUserDetails?.picture) {
        delete sanitizedUserDetails?.picture.fileId;
        delete sanitizedUserDetails?.picture.shareableLink;
    }

    // Aggregation pipeline to fetch and populate the updated document
    const aggregationPipeline = RoleAggregationPipeline.getRole(
        sanitizedUserDetails?.role
    );

    // Fetch the updated permission using the aggregation pipeline
    const populatedRole = await RoleModel.aggregate(aggregationPipeline);

    // Check if the populatedPermission query returned a document
    if (!populatedRole || populatedRole?.length === 0) {
        throw {
            statusCode: httpStatus.OK,
            message: 'User creation successful but role population failed.',
        };
    }

    // Create the response object
    const response = {
        ...sanitizedUserDetails, // Spread sanitized user details instead of original userDetails
        role: populatedRole[0], // Include role details
    };

    // Return the updated user information
    return sendServiceResponse(
        httpStatus.OK,
        'User updated successfully.',
        response
    );
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
