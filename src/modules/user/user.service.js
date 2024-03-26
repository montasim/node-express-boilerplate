/**
 * @fileoverview User Service Module for Node.js Express API.
 *
 * This module encapsulates the business logic for managing user entities in a Node.js application, providing
 * a comprehensive set of functions for creating, retrieving, updating, and deleting users. It serves as an
 * intermediary layer between the application's controllers and the database, ensuring that user data is handled
 * according to the application's business rules and security protocols.
 *
 * The UserService leverages other utility modules and external services to perform tasks such as:
 * - Email uniqueness checks and validation
 * - Secure password handling and authentication token generation
 * - Role assignment and validation
 * - File upload to external storage (Google Drive) for user profile pictures
 * - Email notifications for account verification and alerts
 *
 * By abstracting these operations into a dedicated service layer, the module promotes separation of concerns,
 * code reusability, and maintainability. It also simplifies the integration of user management functionalities
 * across different parts of the application, enabling a consistent and secure user experience.
 *
 * Key operations include:
 * - User registration with comprehensive data validation and optional profile picture upload
 * - Detailed user profile retrieval, supporting filtering, pagination, and role-based access control
 * - User profile updates, including secure password changes and profile picture management
 * - User account deletion with proper cleanup of associated resources and data
 *
 * The UserService's design and implementation follow best practices for modern web application development,
 * emphasizing security, scalability, and a clean separation of concerns. It is an essential component of the
 * application's backend architecture, facilitating robust user management capabilities.
 */

import httpStatus from 'http-status';

import sendServiceResponse from '../../utils/sendServiceResponse.js';
import excludeSensitiveFields from '../../utils/excludeSensitiveFields.js';

import UserModel from './user.model.js';
import RoleModel from '../auth/role/role.model.js';
import GoogleDriveFileOperations from '../../utils/GoogleDriveFileOperations.js';
import TokenService from '../auth/token/token.service.js';
import RoleAggregationPipeline from '../auth/role/role.pipeline.js';
import EmailService from '../email/email.service.js';
import constants from '../../constants/constants.js';

import ServerError from '../../utils/serverError.js';

/**
 * Asynchronously creates a new user in the database with the given registration data and an optional file
 * for the user's picture, which is uploaded to Google Drive if present. It checks for email uniqueness,
 * assigns a default role to the user, generates authentication tokens, and sends an email verification link.
 * This process includes several steps:
 *
 * 1. Verifies that the provided email address is not already in use.
 * 2. Uploads the user's picture to Google Drive if a file is provided, handling any upload errors.
 * 3. Assigns a default role to the user, creating it if it doesn't already exist.
 * 4. Creates the user document in the database with the provided data, default role, and picture information.
 * 5. Generates authentication tokens for the new user.
 * 6. Sends an email to the new user with a link to verify their email address.
 * 7. Fetches and populates the user's role with permissions using an aggregation pipeline.
 * 8. Sanitizes the user data to remove sensitive fields before sending it in the response.
 *
 * If any step in this process fails, an appropriate error is thrown with a specific status code and message.
 *
 * @param sessionUser
 * @param {Object} createUserData The data for registering the new user.
 * @param {Object} [file] An optional file object representing the user's picture to be uploaded.
 * @returns {Promise<Object>} A promise that resolves to the service response object containing the user's data,
 *                            authentication tokens, and populated role information. This response is sent back
 *                            to the client with a 201 Created status code.
 * @throws {Object} Throws an error object with a status code and message if the process fails at any step.
 * @example
 * // Example of creating a new user with register data and a picture file
 * const registerData = {
 *   name: 'John Doe',
 *   email: 'john.doe@example.com',
 *   password: 'SecureP@ssw0rd!',
 * };
 * const file = { ... }; // file object representing the user's picture
 * createUser(registerData, file)
 *   .then(response => console.log(response))
 *   .catch(error => console.error(error));
 */
const createUser = async (sessionUser, createUserData, file) => {
    // Check if the email already exists
    const checkIfEmailExists = await UserModel.isEmailTaken(
        createUserData.email
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
            createdBy: constants.defaultUserId,
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
    const createdBy = sessionUser?.id || constants.defaultUserId;
    const newUserDetails = await UserModel.create({
        ...createUserData,
        role: defaultRole?.id,
        picture: pictureData || null,
        createdBy: createdBy,
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

/**
 * Constructs and executes an aggregation pipeline to query users from the database based on the provided
 * filter and options. This function dynamically builds the aggregation stages to include filtering by
 * various user attributes, sorting, and pagination. It also performs lookups to enrich the user documents
 * with related data from other collections (e.g., roles, createdBy, updatedBy) and excludes certain fields
 * from the final output for privacy and relevance.
 *
 * @param {Object} filter An object containing filter criteria for querying users. Supported filters include
 *                        name (partial match), isActive (exact match), createdBy, updatedBy, createdAt, and updatedAt.
 * @param {Object} options An object containing options for sorting and pagination. Supported options include
 *                         sortBy (a string in the format "field:direction"), limit (number of documents to return),
 *                         and page (page number for pagination).
 * @returns {Promise<Object>} A promise that resolves to an object containing the query results, including
 *                            total number of matching users, limit, current page, and an array of user documents.
 *                            If no users are found, it throws an error with HTTP status 404 (Not Found).
 * @throws {Object} Throws an error object with a status code and message if no users are found or if an error
 *                  occurs during the execution of the aggregation pipeline.
 * @example
 * // Example of querying users with a name filter, sorted by createdAt in descending order,
 * // with a limit of 10 users per page, and fetching the second page.
 * queryUsers({ name: 'John' }, { sortBy: 'createdAt:desc', limit: 10, page: 2 })
 *   .then(data => console.log(data))
 *   .catch(error => console.error(error));
 */
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

/**
 * Retrieves detailed information for a user identified by a specific ID. This function performs several
 * steps to ensure comprehensive data is returned, including finding the user in the database, populating
 * the user's role information through an aggregation pipeline, and sanitizing the returned user object by
 * removing sensitive fields.
 *
 * If the user cannot be found, an error is thrown indicating the user does not exist. Additionally, if the
 * role population fails (e.g., the role does not exist or cannot be retrieved), an error is thrown to
 * indicate successful user retrieval but failed role population.
 *
 * @param {string} userId The unique identifier of the user to be retrieved.
 * @returns {Promise<Object>} A promise that resolves to an object containing the sanitized user details
 *                            and populated role information. The response is formatted and sent back to
 *                            the client, indicating successful retrieval of the user data.
 * @throws {Object} Throws an error object with a status code and message if the user cannot be found,
 *                  or if role population fails after successfully retrieving the user.
 * @example
 * // Example of retrieving a user by their ID
 * getUserById('user123')
 *   .then(response => console.log(response))
 *   .catch(error => console.error(error));
 */
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

/**
 * Retrieves a user from the database based on the provided email address. This function queries
 * the UserModel for a single document matching the specified email. It's a straightforward lookup
 * that returns the user document if a match is found. This can be particularly useful in authentication
 * flows, where an email address is used as a unique identifier for login purposes.
 *
 * @param {string} email The email address of the user to retrieve.
 * @returns {Promise<Object|null>} A promise that resolves to the user document if a matching email
 *                                 is found, or `null` if no match exists. The returned user document
 *                                 includes all fields stored in the database for that user.
 * @example
 * // Example of retrieving a user by their email address
 * getUserByEmail('jane.doe@example.com')
 *   .then(user => {
 *     if (user) {
 *       console.log('User found:', user);
 *     } else {
 *       console.log('No user found with that email address.');
 *     }
 *   })
 *   .catch(error => console.error('Error fetching user:', error));
 */
const getUserByEmail = async email => {
    return await UserModel.findOne({ email: email });
};

/**
 * Updates an existing user in the database by their unique ID with the provided data and optionally
 * updates the user's picture file. This function handles the complexities of checking for changes in
 * the user data, verifying email uniqueness (if updated), handling file uploads to Google Drive, and
 * cleaning up any previous picture files associated with the user. It ensures that sensitive fields
 * are not inadvertently exposed in the response and populates the user's role with detailed information
 * from the Role model using an aggregation pipeline.
 *
 * @param sessionUser
 * @param {string} userId The unique identifier of the user to update.
 * @param {Object} updateUserData The new data for the user, which may include any fields from the user schema
 *                          such as name, email, etc. If the email field is present and different from the
 *                          current one, its uniqueness is checked against the database.
 * @param {Object} [file] An optional file object representing the new picture to upload for the user. If
 *                        provided, the existing picture (if any) is replaced, and the old file is deleted
 *                        from Google Drive.
 * @returns {Promise<Object>} A promise that resolves to the service response object containing the updated
 *                            user information, excluding sensitive fields, and detailed role information.
 * @throws {Object} Throws an error object with a status code and message if the user cannot be found, if
 *                  the provided email is already taken, if the file upload fails, or if any other error occurs
 *                  during the update process.
 * @example
 * // Example of updating a user's data and picture
 * const userId = 'user123';
 * const newUserData = {
 *   name: 'John Doe Updated',
 *   email: 'johnupdated@example.com',
 * };
 * const file = { /* file data *\/ };
 * updateUserById(userId, newUserData, file)
 *   .then(response => console.log('User updated successfully:', response))
 *   .catch(error => console.error('Error updating user:', error));
 */
const updateUserById = async (sessionUser, userId, updateUserData, file) => {
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
    for (const [key, value] of Object.entries(updateUserData)) {
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

    if (updateUserData?.email && updateUserData?.email !== oldUserData?.email) {
        // Check if the new email already exists
        const emailTaken = await UserModel.findOne({
            email: updateUserData?.email,
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
        updateUserData.picture = pictureData; // Assuming pictureData structure matches your UserModel
    }

    // Prepare the updated data
    const updatedBy = sessionUser?.id || constants.defaultUserId;
    const updateData = {
        ...updateUserData,
        isEmailVerified: false,
        updatedBy: updatedBy,
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
 * Deletes a user from the database based on the provided user ID. This function first retrieves
 * the user to ensure they exist before attempting to delete them. If the user is found, it is
 * removed from the database. This approach provides an extra layer of validation to avoid attempting
 * to delete non-existent users, and it allows for any pre-delete or post-delete hooks defined on the
 * user model to be executed.
 *
 * @param {string} userId The unique identifier of the user to be deleted.
 * @returns {Promise<Object>} A promise that resolves with the deleted user object, indicating that
 *                            the user was successfully removed from the database.
 * @throws {ServerError} Throws a `ServerError` with a status code of 404 (Not Found) if the user
 *                       cannot be found in the database.
 * @example
 * // Example of deleting a user by their ID
 * deleteUserById('user123')
 *   .then(deletedUser => console.log('User deleted successfully:', deletedUser))
 *   .catch(error => console.error('Error deleting user:', error));
 */
const deleteUserById = async userId => {
    const user = await getUserById(userId);

    if (!user) {
        throw new ServerError(httpStatus.NOT_FOUND, 'User not found');
    }

    await user.remove();

    return user;
};

/**
 * UserService aggregates functions for user management, providing a centralized interface for creating,
 * querying, updating, and deleting users. Each function within the service corresponds to a specific
 * operation on the user data model, facilitating interactions with the database and abstracting the
 * complexities involved in direct database manipulation. This service allows for streamlined user
 * management processes across the application, ensuring consistent business logic enforcement and
 * simplifying maintenance.
 *
 * Functions included in the UserService:
 * - `createUser`: Registers a new user with the provided data and an optional picture file.
 * - `queryUsers`: Fetches a list of users based on filtering, sorting, and pagination criteria.
 * - `getUserById`: Retrieves detailed information for a specific user by their unique ID.
 * - `getUserByEmail`: Fetches a user's data based on their email address.
 * - `updateUserById`: Updates an existing user's information by their ID with provided new data and
 *                     an optional new picture, ensuring data integrity and relevance.
 * - `deleteUserById`: Removes a user from the database based on their unique ID, handling any necessary
 *                     cleanup operations to maintain database integrity.
 *
 * These functions collectively support a wide range of user management tasks, from basic CRUD operations
 * to more complex queries and updates, making the UserService a crucial component of the application's
 * backend architecture.
 *
 * @example
 * // Example of using UserService to create a new user
 * const newUser = {
 *   name: 'John Doe',
 *   email: 'john.doe@example.com',
 *   password: 'securepassword123'
 * };
 * UserService.createUser(newUser)
 *   .then(user => console.log('New user created:', user))
 *   .catch(error => console.error('Error creating user:', error));
 */
const UserService = {
    createUser,
    queryUsers,
    getUserById,
    getUserByEmail,
    updateUserById,
    deleteUserById,
};

export default UserService;
