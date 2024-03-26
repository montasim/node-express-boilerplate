/**
 * @fileoverview User Controller for Node.js Express API.
 *
 * This module encapsulates controller functions for managing user entities within a Node.js Express application,
 * offering a structured approach to executing CRUD operations on user data. Each function within the UserController
 * is designed to interact with the UserService layer, handling the complexities of request processing, business logic
 * execution, and response formation.
 *
 * By leveraging utilities such as `asyncErrorHandler` for error management, `pick` for request data filtering, and
 * `sendControllerSuccessResponse` for standardized success responses, the UserController ensures that user management
 * functionalities are both robust and consistent with the application's overall architectural patterns.
 *
 * Key functionalities include:
 * - Creating new users and ensuring data validation and uniqueness constraints are met.
 * - Retrieving single or multiple user records with support for filtering, sorting, and pagination, enhancing data access flexibility.
 * - Updating user information securely, including support for file uploads in user profiles.
 * - Deleting users, with appropriate checks and balances to maintain data integrity.
 *
 * The UserController serves as a pivotal component of the application's backend, facilitating secure and efficient
 * user data management while promoting code usability and maintainability through its structured approach to
 * request handling.
 */

import httpStatus from 'http-status';

import pick from '../../utils/pick.js';
import asyncErrorHandler from '../../utils/asyncErrorHandler.js';
import sendControllerSuccessResponse from '../../utils/sendControllerSuccessResponse.js';

import UserService from './user.service.js';

/**
 * Handles HTTP POST requests to create a new user. It leverages the UserService to create a user
 * with the provided request data. This function is wrapped with an `asyncErrorHandler` to automatically
 * catch and handle any asynchronous errors that occur during the user creation process, simplifying error
 * management and enhancing code readability.
 *
 * Upon successful creation of the user, it sends a success response back to the client including the new user's data.
 * If the user creation fails due to a service layer validation or other operational errors, those are caught by the
 * `asyncErrorHandler` and passed to the next error-handling middleware defined in the Express application.
 *
 * @param {Object} req The Express request object, containing the data for creating a new user in the `body` property.
 * @param {Object} res The Express response object, used for sending a response back to the client.
 * @returns {Promise<void>} A promise that resolves with no value, indicating the completion of request handling.
 * @example
 * // Example Express route for creating a new user
 * app.post('/users', createUser);
 *
 * // This will handle POST requests to '/users', attempting to create a new user with the provided data
 * // and sending a response back to the client. Any errors encountered during this process are handled
 * // by the `asyncErrorHandler`.
 */
const createUser = asyncErrorHandler(async (req, res) => {
    const sessionUser = req?.sessionUser || null;
    const file = req.file;
    const newUser = await UserService.createUser(sessionUser, req.body, file);

    // Send the roles data
    return sendControllerSuccessResponse(res, newUser);
});

/**
 * Handles HTTP GET requests to retrieve users based on various filtering and pagination options. This function
 * leverages the `asyncErrorHandler` middleware for streamlined error handling and uses the `UserService` to
 * query the database for users. Filters and options are extracted from the request's query parameters to allow
 * for flexible user queries, including filtering by user attributes and controlling the sort order, pagination limit,
 * and page number.
 *
 * The retrieved user data, including any relevant metadata for pagination, is then sent back to the client in a
 * standardized format using `sendControllerSuccessResponse`. This approach ensures consistency in response
 * formatting and simplifies client-side data handling.
 *
 * @param {Object} req The Express request object. Expected to contain filtering and pagination parameters within
 *                     `req.query`, and optionally, a `sessionUser` property if session management is implemented.
 * @param {Object} res The Express response object, used for sending a structured response back to the client.
 * @returns {Promise<void>} A promise that resolves with no value, signifying the completion of the request handling.
 * @example
 * // Example Express route for fetching users
 * app.get('/users', getUsers);
 *
 * // Clients can request users with URL parameters like:
 * // GET /users?name=John&isActive=true&sortBy=createdAt:desc&limit=10&page=2
 * // This will fetch users named "John" who are active, sorted by creation date in descending order,
 * // with a limit of 10 users per page, and returning the second page of results.
 */
const getUsers = asyncErrorHandler(async (req, res) => {
    const sessionUser = req?.sessionUser || null;
    const filter = pick(req.query, [
        'name',
        'isActive',
        'createdBy',
        'updatedBy',
        'createdAt',
        'updatedAt',
    ]);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);

    const getRoleData = await UserService.queryUsers(
        sessionUser,
        filter,
        options
    );

    // Send the roles data
    return sendControllerSuccessResponse(res, getRoleData);
});

/**
 * Handles HTTP GET requests to retrieve and return information for a specific user identified by
 * a user ID passed as a URL parameter. This controller function abstracts the process of fetching
 * user data from the database through the UserService and ensures any potential errors in the process
 * are handled gracefully by wrapping the function call in an `asyncErrorHandler`.
 *
 * Upon successfully retrieving the user data, this function sends it back to the client using
 * `sendControllerSuccessResponse`, which standardizes the response format, enhancing API consistency
 * and easing client-side data handling.
 *
 * @param {Object} req The Express request object, expected to contain the user ID in `req.params.userId`.
 * @param {Object} res The Express response object, used for sending the response back to the client.
 * @returns {Promise<void>} A promise that resolves when the response has been sent, indicating the
 *                          end of the request-handling process.
 * @example
 * // Assuming an Express route setup like so:
 * app.get('/users/:userId', getUser);
 *
 * // A GET request to /users/12345 will fetch and return the data for the user with ID 12345,
 * // formatted and sent in a standardized response structure.
 */
const getUser = asyncErrorHandler(async (req, res) => {
    const userId = req?.params?.userId || null; // Get the user ID from the request params
    const userData = await UserService.getUserById(userId); // Get the user data

    // Send the role data
    return sendControllerSuccessResponse(res, userData);
});

/**
 * Handles HTTP PUT requests to update a specific user's information in the database. This function
 * retrieves the user ID from the request parameters and the data to update from the request body. It
 * then utilizes the UserService to perform the update operation. If the operation is successful, the
 * updated user information is sent back to the client. The function is wrapped in `asyncErrorHandler`
 * to ensure any errors encountered during the update process are handled gracefully and reported
 * appropriately.
 *
 * @param {Object} req The Express request object, containing the `userId` in `req.params` and the
 *                     update data in `req.body`.
 * @param {Object} res The Express response object, used for sending the updated user data back to
 *                     the client.
 * @returns {Promise<void>} A promise that resolves when the response has been sent, indicating the
 *                          completion of the request-handling process. This function does not explicitly
 *                          return a value, as its primary purpose is to respond to the HTTP request.
 * @example
 * // Example Express route setup for updating a user
 * app.put('/users/:userId', updateUser);
 *
 * // A PUT request to /users/123 with a request body containing the fields to update will
 * // trigger the updateUser function, updating the user with ID 123 and returning the updated
 * // user information.
 */
const updateUser = asyncErrorHandler(async (req, res) => {
    const sessionUser = req?.sessionUser || null;
    const userId = req?.params?.permissionId || null;
    const file = req.file;
    const user = await UserService.updateUserById(
        sessionUser,
        userId,
        req.body,
        file
    );

    res.send(user);
});

/**
 * Handles HTTP DELETE requests to remove a specific user from the database. It identifies the user
 * to be deleted by the `userId` provided in the request parameters and delegates the deletion task
 * to the UserService. Upon successful deletion, it sends an HTTP 204 No Content response, indicating
 * that the operation was successful but there is no content to return.
 *
 * This function is wrapped in `asyncErrorHandler`, which ensures that any errors occurring during the
 * deletion process are caught and handled appropriately, facilitating error reporting and graceful failure
 * handling.
 *
 * @param {Object} req The Express request object, expected to contain the `userId` in `req.params` for
 *                     identifying the user to delete.
 * @param {Object} res The Express response object, used to send the HTTP response back to the client.
 * @returns {Promise<void>} A promise that resolves when the response has been sent. This indicates that
 *                          the request handling process has been completed. The function itself does not
 *                          return any value, as its purpose is to effect a change in the database and
 *                          communicate the outcome via the HTTP response.
 * @example
 * // Example Express route setup for deleting a user
 * app.delete('/users/:userId', deleteUser);
 *
 * // A DELETE request to /users/123 will trigger the deleteUser function, attempting to remove
 * // the user with ID 123 from the database and returning an HTTP 204 No Content response upon success.
 */
const deleteUser = asyncErrorHandler(async (req, res) => {
    await UserService.deleteUserById(req.params.userId);

    res.status(httpStatus.NO_CONTENT).send();
});

/**
 * UserController aggregates controller functions for managing user entities within the application.
 * It provides a structured approach to handling CRUD operations related to users, facilitating
 * interactions between the client-side requests and the server-side user service logic. Each
 * controller function is designed to handle a specific type of request, ensuring that user-related
 * actions are executed efficiently and securely.
 *
 * Functions:
 * - `createUser`: Handles requests for creating new user entities.
 * - `getUsers`: Manages retrieval of multiple users, supporting filtering, sorting, and pagination.
 * - `getUser`: Deals with fetching data for a single user based on their unique identifier.
 * - `updateUser`: Handles updates to existing user records, applying changes to user data as requested.
 * - `deleteUser`: Manages deletion of user records, removing users from the database as required.
 *
 * This organization of user-related controller functions under a unified controller object simplifies
 * the routing and middleware setup in the application, promoting code reusability and maintainability.
 *
 * @example
 * // Example of using UserController in Express route definitions
 * const express = require('express');
 * const router = express.Router();
 *
 * // Create a new user
 * router.post('/users', UserController.createUser);
 *
 * // Retrieve all users
 * router.get('/users', UserController.getUsers);
 *
 * // Retrieve a single user by ID
 * router.get('/users/:userId', UserController.getUser);
 *
 * // Update a user by ID
 * router.put('/users/:userId', UserController.updateUser);
 *
 * // Delete a user by ID
 * router.delete('/users/:userId', UserController.deleteUser);
 *
 * module.exports = router;
 */
const UserController = {
    createUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
};

export default UserController;
