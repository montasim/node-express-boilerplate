/**
 * @fileoverview
 * This file contains validation schemas for a production-ready Node.js, Express, and MongoDB API
 * designed for managing user entities. It includes schemas for creating, fetching, updating, and
 * deleting users, ensuring that incoming data is properly validated and meets predefined criteria
 * before interacting with the database. These validation schemas utilize Joi for input validation
 * and include custom validators for specific fields such as email, password, name, and role.
 *
 * This API follows industry best practices for input validation, enhancing data integrity,
 * usability, and security. It is intended for use in production environments where robust
 * validation of user data is essential.
 */

import Joi from 'joi';

import CustomValidation from '../../validations/custom.validation.js';
import customValidation from '../../validations/custom.validation.js';
import constants from '../../constants/constants.js';

/**
 * Validation schema for creating a new user. This schema utilizes Joi to define the constraints and
 * requirements for user data submitted as part of user creation requests. It includes validators for
 * each field relevant to a user entity, ensuring that incoming data is properly formatted, meets
 * predefined criteria, and passes custom validation logic where necessary.
 *
 * Fields validated by this schema:
 * - `email`: Ensures the email field is a trimmed string, conforms to email format, and is required.
 *            Utilizes an external custom validation function to check for uniqueness or other criteria.
 * - `password`: Validates that the password is present and meets any custom-defined requirements through
 *               an external validation function.
 * - `name`: Applies a custom string validator to ensure the name is a string that matches a specific
 *           pattern and falls within a defined length range. This field is required for user creation.
 * - `role`: Uses a custom validator to ensure the role ID matches a specific pattern, supporting validation
 *           of references to other entities within the system.
 *
 * This schema is designed to be used with request validation middleware, providing a robust layer of
 * input validation for user creation operations, thus enhancing data integrity and security.
 *
 * @example
 * // Example usage in an Express route for creating a new user
 * router.post('/users', validate(createUser), async (req, res) => {
 *   // Route handler logic, assuming `validate` is middleware that applies Joi validation
 *   const newUserDetails = await UserService.createUser(req.body);
 *   res.status(httpStatus.CREATED).send(newUserDetails);
 * });
 */
const createUser = {
    body: Joi.object().keys({
        email: Joi.string()
            .trim()
            .email()
            .required()
            .external(CustomValidation.email),
        password: Joi.string().required().external(CustomValidation.password),
        name: customValidation
            .stringValidator('user', constants.namePattern, 3, 50)
            .required(),
        role: customValidation.id(constants.roleIdPattern),
    }),
};

/**
 * Validation schema for querying users based on various filtering and pagination parameters. This schema
 * uses Joi to define the structure and constraints of the query parameters that can be provided when
 * fetching a list of users. It supports filtering by user name and role, as well as pagination and sorting
 * options, ensuring that query parameters are correctly formatted and within acceptable bounds.
 *
 * Supported query parameters:
 * - `name`: Applies a custom string validator to ensure the name matches a specific pattern and falls within
 *           a defined length range. This allows for filtering users by name according to the application's
 *           validation rules.
 * - `role`: Uses a custom validator to check that the role ID matches a specific pattern, enabling filtering
 *           by user role.
 * - `sortBy`: A string parameter that specifies the field and order by which the results should be sorted
 *             (e.g., 'createdAt:asc'). It's trimmed to remove any leading or trailing whitespace.
 * - `limit`: An integer that defines the maximum number of users to return, helping implement pagination.
 *            It has a minimum value to ensure pagination makes practical sense and a maximum to prevent
 *            overly large queries.
 * - `page`: An integer indicating the page number of results to return, used in conjunction with `limit`
 *           for pagination. This parameter has both minimum and maximum values to ensure the requested
 *           page is within a sensible range.
 *
 * This schema facilitates robust input validation for user query operations, enhancing usability and
 * security by ensuring only valid and meaningful query parameters are processed.
 *
 * @example
 * // Example usage in an Express route for fetching users
 * router.get('/users', validate(getUsers), async (req, res) => {
 *   // Assuming `validate` is middleware that applies Joi validation
 *   const users = await UserService.queryUsers(req.query);
 *   res.status(httpStatus.OK).send(users);
 * });
 */
const getUsers = {
    query: Joi.object().keys({
        name: customValidation.stringValidator(
            'user',
            constants.namePattern,
            3,
            50
        ),
        role: customValidation.id(constants.roleIdPattern),
        sortBy: Joi.string().trim(),
        limit: Joi.number().integer().min(1).min(100),
        page: Joi.number().integer().min(1).max(10),
    }),
};

/**
 * Validation schema for fetching a user by their ID. This schema uses Joi to define the structure and constraints
 * of the request parameters, ensuring that the provided user ID is formatted correctly and meets the application's
 * validation criteria.
 *
 * Supported request parameters:
 * - `userId`: The ID of the user to fetch. It applies a custom validator to check that the ID matches a specific
 *             pattern, ensuring it conforms to the expected format. This parameter is marked as required to
 *             enforce that a user ID must always be provided when fetching a user.
 *
 * This schema helps ensure that only valid user IDs are accepted in requests to fetch user data, enhancing the
 * reliability and security of the user retrieval process.
 *
 * @example
 * // Example usage in an Express route for fetching a user by ID
 * router.get('/users/:userId', validate(getUser), async (req, res) => {
 *   // Assuming `validate` is middleware that applies Joi validation
 *   const { userId } = req.params;
 *   const user = await UserService.getUserById(userId);
 *   res.status(httpStatus.OK).send(user);
 * });
 */
const getUser = {
    params: Joi.object().keys({
        userId: customValidation.id(constants.userIdPattern).required(),
    }),
};

/**
 * Validation schema for updating a user. This schema defines the structure and constraints for the request parameters
 * and body, ensuring that the provided data for updating a user is formatted correctly and meets the application's
 * validation criteria.
 *
 * Supported request parameters:
 * - `userId`: The ID of the user to update. It applies a custom validator to check that the ID matches a specific
 *             pattern, ensuring it conforms to the expected format. This parameter is marked as required to enforce
 *             that a user ID must always be provided when updating a user.
 *
 * Supported request body fields:
 * - `name`: Optional. The updated name of the user. It applies a custom validator to ensure that the name meets the
 *           specified pattern and length requirements.
 * - `role`: Optional. The updated role of the user. It applies a custom validator to check that the role ID matches
 *           a specific pattern, ensuring it conforms to the expected format.
 * - `isActive`: Optional. The updated status of the user. It applies a custom validator to ensure that the provided
 *               value is a valid boolean.
 *
 * Additionally, the schema enforces that at least one field must be provided for update, preventing requests that
 * attempt to update a user without specifying any changes.
 *
 * This schema helps ensure that only valid data is accepted in requests to update a user, improving the reliability
 * and security of the user modification process.
 *
 * @example
 * // Example usage in an Express route for updating a user
 * router.put('/users/:userId', validate(updateUser), async (req, res) => {
 *   // Assuming `validate` is middleware that applies Joi validation
 *   const { userId } = req.params;
 *   const updatedUser = req.body;
 *   const user = await UserService.updateUserById(userId, updatedUser);
 *   res.status(httpStatus.OK).send(user);
 * });
 */
const updateUser = {
    params: Joi.object().keys({
        userId: customValidation.id(constants.userIdPattern).required(),
    }),
    body: Joi.object()
        .keys({
            name: customValidation.stringValidator(
                'user',
                constants.namePattern,
                3,
                50
            ),
            role: customValidation.id(constants.roleIdPattern),
            isActive: customValidation.isActive(),
        })
        .or('email', 'password', 'name', 'role', 'isActive')
        .messages({
            'object.min': 'At least one field must be provided for update.',
        }),
};

/**
 * Validation schema for deleting a user. This schema defines the structure and constraints for the request parameters,
 * ensuring that the provided user ID for deletion is formatted correctly and meets the application's validation criteria.
 *
 * Supported request parameters:
 * - `userId`: The ID of the user to delete. It applies a custom validator to check that the ID matches a specific
 *             pattern, ensuring it conforms to the expected format. This parameter is marked as required to enforce
 *             that a user ID must always be provided when deleting a user.
 *
 * This schema helps ensure that only valid data is accepted in requests to delete a user, improving the reliability
 * and security of the user deletion process.
 *
 * @example
 * // Example usage in an Express route for deleting a user
 * router.delete('/users/:userId', validate(deleteUser), async (req, res) => {
 *   // Assuming `validate` is middleware that applies Joi validation
 *   const { userId } = req.params;
 *   await UserService.deleteUserById(userId);
 *   res.status(httpStatus.NO_CONTENT).send();
 * });
 */
const deleteUser = {
    params: Joi.object().keys({
        userId: customValidation.id(constants.userIdPattern).required(),
    }),
};

/**
 * Object containing validation schemas for user-related operations. Each schema defines the structure and constraints
 * for the request parameters or body, ensuring that incoming data meets the application's validation criteria.
 *
 * Supported operations:
 * - createUser: Validation schema for creating a new user, including constraints for email, password, name, and role.
 * - getUsers: Validation schema for retrieving a list of users, including optional filters for name, role, sorting,
 *             pagination limit, and page number.
 * - getUser: Validation schema for retrieving a single user by their ID, ensuring the provided user ID is formatted
 *            correctly.
 * - updateUser: Validation schema for updating user details, including constraints for updating name, role, and
 *               activation status. It also enforces that at least one field is provided for update.
 * - deleteUser: Validation schema for deleting a user, ensuring the provided user ID is formatted correctly.
 *
 * These validation schemas help ensure that only valid data is accepted in user-related operations, improving the
 * reliability and security of user management functionality.
 *
 * @example
 * // Example usage in an Express route for creating a new user
 * router.post('/users', validate(UserValidation.createUser), async (req, res) => {
 *   // Assuming `validate` is middleware that applies Joi validation
 *   // Logic for creating a new user...
 * });
 */
const UserValidation = {
    createUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
};

export default UserValidation;
