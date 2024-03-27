import pick from '../../../utils/pick.js';

import sendControllerResponse from '../../../utils/sendControllerResponse.js';
import asyncErrorHandler from '../../../utils/asyncErrorHandler.js';

import RoleService from './role.service.js';

const createRole = asyncErrorHandler(async (req, res) => {
    const sessionUser = req?.sessionUser || null;
    const createRoleData = await RoleService.createRole(sessionUser, req.body);

    // Send the new role data
    return sendControllerResponse(res, createRoleData);
});

const getRoles = asyncErrorHandler(async (req, res) => {
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

    const createRoleData = await RoleService.getRoles(
        sessionUser,
        filter,
        options
    );

    // Send the roles data
    return sendControllerResponse(res, createRoleData);
});

const getRole = asyncErrorHandler(async (req, res) => {
    const roleId = req?.params?.roleId || null;
    const roleData = await RoleService.getRole(roleId);

    // Send the role data
    return sendControllerResponse(res, roleData);
});

const updateRole = asyncErrorHandler(async (req, res) => {
    const sessionUser = req?.sessionUser || null;
    const roleId = req?.params?.roleId || null;
    const createRoleData = await RoleService.updateRole(
        sessionUser,
        roleId,
        req.body
    );

    // Send the role data
    return sendControllerResponse(res, createRoleData);
});

const deleteRole = asyncErrorHandler(async (req, res) => {
    const roleId = req?.params?.roleId || null;
    const createRoleData = await RoleService.deleteRole(roleId);

    // Send the role data
    return sendControllerResponse(res, createRoleData);
});

const RoleController = {
    createRole,
    getRoles,
    getRole,
    updateRole,
    deleteRole,
};

export default RoleController;
