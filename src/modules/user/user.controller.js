import httpStatus from 'http-status';

import pick from '../../utils/pick.js';
import asyncErrorHandler from '../../utils/asyncErrorHandler.js';

import UserService from './user.service.js';

import ServerError from '../../utils/serverError.js';

const createUser = asyncErrorHandler(async (req, res) => {
    const user = await UserService.createUser(req.body);
    res.status(httpStatus.CREATED).send(user);
});

const getUsers = asyncErrorHandler(async (req, res) => {
    const filter = pick(req.query, ['name', 'role']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await UserService.queryUsers(filter, options);
    res.send(result);
});

const getUser = asyncErrorHandler(async (req, res) => {
    const user = await UserService.getUserById(req.params.userId);
    if (!user) {
        throw new ServerError(httpStatus.NOT_FOUND, 'User not found');
    }
    res.send(user);
});

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
