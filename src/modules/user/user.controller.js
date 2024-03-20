import httpStatus from 'http-status';

import pick from '../../utils/pick.js';
import asyncErrorHandler from '../../utils/asyncErrorHandler.js';
import sendControllerSuccessResponse from '../../utils/sendControllerSuccessResponse.js';
import sendControllerErrorResponse from '../../utils/sendControllerErrorResponse.js';

import UserService from './user.service.js';

const createUser = asyncErrorHandler(async (req, res) => {
    try {
        const newUser = await UserService.createUser(req.body);

        // Send the roles data
        return sendControllerSuccessResponse(res, newUser);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'UserController.createUser()'
        );
    }
});

const getUsers = async (req, res) => {
    try {
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
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'UserController.getUsers()'
        );
    }
};

const getUser = async (req, res) => {
    try {
        const userId = req?.params?.userId || null; // Get the user ID from the request params
        const userData = await UserService.getUserById(userId); // Get the user data

        // Send the role data
        return sendControllerSuccessResponse(res, userData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'UserController.getUser()'
        );
    }
};

const updateUser = asyncErrorHandler(async (req, res) => {
    const user = await UserService.updateUserById(req.params.userId, req.body);
    res.send(user);
});

const deleteUser = asyncErrorHandler(async (req, res) => {
    await UserService.deleteUserById(req.params.userId);
    res.status(httpStatus.NO_CONTENT).send();
});

const UserController = {
    createUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
};

export default UserController;
