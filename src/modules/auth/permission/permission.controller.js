import pick from '../../../utils/pick.js';
import sendControllerResponse from '../../../utils/sendControllerResponse.js';
import asyncErrorHandler from '../../../utils/asyncErrorHandler.js';

import PermissionService from './permission.service.js';

const createPermission = asyncErrorHandler(async (req, res) => {
    const sessionUser = req?.sessionUser || null;
    const createPermissionData = await PermissionService.createPermission(
        sessionUser,
        req.body
    );

    // Send the new permission data
    return sendControllerResponse(res, createPermissionData);
});

const getPermissions = asyncErrorHandler(async (req, res) => {
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

    const createPermissionData = await PermissionService.getPermissions(
        sessionUser,
        filter,
        options
    );

    // Send the permissions data
    return sendControllerResponse(res, createPermissionData);
});

const getPermission = asyncErrorHandler(async (req, res) => {
    const permissionId = req?.params?.permissionId || null;
    const permissionData = await PermissionService.getPermission(permissionId);

    // Send the permission data
    return sendControllerResponse(res, permissionData);
});

const updatePermission = asyncErrorHandler(async (req, res) => {
    const sessionUser = req?.sessionUser || null;
    const permissionId = req?.params?.permissionId || null;
    const createPermissionData = await PermissionService.updatePermission(
        sessionUser,
        permissionId,
        req.body
    );

    // Send the permission data
    return sendControllerResponse(res, createPermissionData);
});

const deletePermission = asyncErrorHandler(async (req, res) => {
    const permissionId = req?.params?.permissionId || null;
    const createPermissionData =
        await PermissionService.deletePermission(permissionId);

    // Send the permission data
    return sendControllerResponse(res, createPermissionData);
});

const PermissionController = {
    createPermission,
    getPermissions,
    getPermission,
    updatePermission,
    deletePermission,
};

export default PermissionController;
