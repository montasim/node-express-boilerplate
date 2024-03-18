import pick from '../../utils/pick.js';

import sendControllerErrorResponse from '../../utils/sendControllerErrorResponse.js';
import sendControllerSuccessResponse from '../../utils/sendControllerSuccessResponse.js';

import RoleService from './role.service.js';

const createRole = async (req, res) => {
    try {
        const sessionUser = req?.sessionUser || null;
        const createRoleData = await RoleService.createRole(
            sessionUser,
            req.body
        );

        // Send the new role data
        return sendControllerSuccessResponse(res, createRoleData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'RoleController.createRole()'
        );
    }
};

const getRoles = async (req, res) => {
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

        const createRoleData = await RoleService.getRoles(
            sessionUser,
            filter,
            options
        );

        // Send the roles data
        return sendControllerSuccessResponse(res, createRoleData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'RoleController.getRoles()'
        );
    }
};

const getRole = async (req, res) => {
    try {
        const roleId = req?.params?.roleId || null;
        const roleData = await RoleService.getRole(roleId);

        // Send the role data
        return sendControllerSuccessResponse(res, roleData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'RoleController.getRole()'
        );
    }
};

const updateRole = async (req, res) => {
    try {
        const sessionUser = req?.sessionUser || null;
        const roleId = req?.params?.roleId || null;
        const createRoleData = await RoleService.updateRole(
            sessionUser,
            roleId,
            req.body
        );

        // Send the role data
        return sendControllerSuccessResponse(res, createRoleData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'RoleController.updateRole()'
        );
    }
};

const deleteRole = async (req, res) => {
    try {
        const roleId = req?.params?.roleId || null;
        const createRoleData = await RoleService.deleteRole(roleId);

        // Send the role data
        return sendControllerSuccessResponse(res, createRoleData);
    } catch (error) {
        return sendControllerErrorResponse(
            res,
            error,
            'RoleController.deleteRole()'
        );
    }
};

const RoleController = {
    createRole,
    getRoles,
    getRole,
    updateRole,
    deleteRole,
};

export default RoleController;
