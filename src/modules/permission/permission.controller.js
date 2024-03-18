import httpStatus from 'http-status';

import PermissionService from './permission.service.js';
import pick from '../../utils/pick.js';

const createPermission = async (req, res) => {
    try {
        const sessionUser = req?.sessionUser || null;
        const createPermissionData = await PermissionService.createPermission(
            sessionUser,
            req.body
        );

        const controllerResponse = {
            success: createPermissionData.success,
            statusCode: createPermissionData.statusCode,
            message: createPermissionData.message,
            data: createPermissionData.data,
        };

        res.status(controllerResponse.statusCode).json(controllerResponse);
    } catch (error) {
        const errorResponse = {
            success: false,
            statusCode: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
            message:
                error.message ||
                'Internal server error on PermissionController.createPermission()',
            data: null,
        };

        res.status(errorResponse.statusCode).json(errorResponse);
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

        const controllerResponse = {
            success: createPermissionData.success,
            statusCode: createPermissionData.statusCode,
            message: createPermissionData.message,
            data: createPermissionData.data,
        };

        res.status(controllerResponse.statusCode).json(controllerResponse);
    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
    }
};

const getPermission = async (req, res) => {
    try {
        const permissionId = req?.params?.permissionId || null;
        const createPermissionData =
            await PermissionService.getPermission(permissionId);

        const controllerResponse = {
            success: createPermissionData.success,
            statusCode: createPermissionData.statusCode,
            message: createPermissionData.message,
            data: createPermissionData.data,
        };

        res.status(controllerResponse.statusCode).json(controllerResponse);
    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
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

        const controllerResponse = {
            success: createPermissionData.success,
            statusCode: createPermissionData.statusCode,
            message: createPermissionData.message,
            data: createPermissionData.data,
        };

        res.status(controllerResponse.statusCode).json(controllerResponse);
    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
    }
};

const deletePermission = async (req, res) => {
    try {
        const permissionId = req?.params?.permissionId || null;
        const createPermissionData =
            await PermissionService.deletePermission(permissionId);

        const controllerResponse = {
            success: createPermissionData.success,
            statusCode: createPermissionData.statusCode,
            message: createPermissionData.message,
            data: createPermissionData.data,
        };

        res.status(controllerResponse.statusCode).json(controllerResponse);
    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
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
