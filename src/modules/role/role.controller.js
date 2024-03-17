import httpStatus from 'http-status';

import RoleService from './role.service.js';

const createRole = async (req, res) => {
    try {
        const { sessionUser, ...roleData } = req.body;
        const createRoleData = await RoleService.createRole(sessionUser, roleData);

        const controllerResponse = {
            success: createRoleData.success,
            statusCode: createRoleData.statusCode,
            message: createRoleData.message,
            data: createRoleData.data,
        };

        res.status(controllerResponse.statusCode).json(controllerResponse);
    } catch (error) {
        const errorResponse = {
            success: false,
            statusCode: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error on RoleController.createRole()',
            data: null,
        };

        res.status(errorResponse.statusCode).json(errorResponse);
    }
};

const getRole = async (req, res) => {
    try {

    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
    }
};

const updateRole = async (req, res) => {
    try {

    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
    }
};

const deleteRole = async (req, res) => {
    try {

    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
    }
};

const RoleController = {
    createRole,
    getRole,
    updateRole,
    deleteRole,
};

export default RoleController;
