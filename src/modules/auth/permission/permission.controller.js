import pick from '../../../utils/pick.js';

import sendControllerErrorResponse from '../../../utils/sendControllerErrorResponse.js';
import sendControllerSuccessResponse from '../../../utils/sendControllerSuccessResponse.js';

import PermissionService from './permission.service.js';

const createPermission = async (req, res) => {
    try {
        const sessionUser = req?.sessionUser || null;
        const createPermissionData = await PermissionService.createPermission(
            sessionUser,
            req.body
        );

        // Send the new permission data
        return sendControllerSuccessResponse(res, createPermissionData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'PermissionController.createPermission()'
        );
    }
};

const getPermissions = async (req, res) => {
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

        const createPermissionData = await PermissionService.getPermissions(
            sessionUser,
            filter,
            options
        );

        // Send the permissions data
        return sendControllerSuccessResponse(res, createPermissionData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'PermissionController.getPermissions()'
        );
    }
};

const getPermission = async (req, res) => {
    try {
        const permissionId = req?.params?.permissionId || null;
        const permissionData =
            await PermissionService.getPermission(permissionId);

        // Send the permission data
        return sendControllerSuccessResponse(res, permissionData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'PermissionController.getPermission()'
        );
    }
};

const updatePermission = async (req, res) => {
    try {
        const sessionUser = req?.sessionUser || null;
        const permissionId = req?.params?.permissionId || null;
        const createPermissionData = await PermissionService.updatePermission(
            sessionUser,
            permissionId,
            req.body
        );

        // Send the permission data
        return sendControllerSuccessResponse(res, createPermissionData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'PermissionController.updatePermission()'
        );
    }
};

const deletePermission = async (req, res) => {
    try {
        const permissionId = req?.params?.permissionId || null;
        const createPermissionData =
            await PermissionService.deletePermission(permissionId);

        // Send the permission data
        return sendControllerSuccessResponse(res, createPermissionData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'PermissionController.deletePermission()'
        );
    }
};

const PermissionController = {
    createPermission,
    getPermissions,
    getPermission,
    updatePermission,
    deletePermission,
};

export default PermissionController;
