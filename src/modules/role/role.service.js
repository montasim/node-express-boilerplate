import httpStatus from 'http-status';

import UserModel from '../user/user.model.js';
import RoleModel from './role.model.js';

const createRole = async (sessionUser, roleData) => {
    try {
        let currentSessionUser = sessionUser;

        // If the session user is not available, use the default user
        if (!currentSessionUser) {
            // Get the default user
            currentSessionUser = UserModel.findById({
                id: 'user-17032024083745-0000000001'
            });

            // If the current session user is not available, return an error
            if (!currentSessionUser) {
                return {
                    success: false,
                    statusCode: httpStatus.FORBIDDEN,
                    message: 'You are not authorized to perform this action',
                    data: null,
                };
            }
        }

        // Create the role
        const newRole = await RoleModel.create({
            ...roleData,
            createdBy: currentSessionUser?.id,
        });

        // Check if the role was created
        if (!newRole) {
            return {
                success: false,
                statusCode: httpStatus.BAD_REQUEST,
                message: 'Failed to create role. Please try again.',
                data: null,
            };
        }

        // Convert the Mongoose document to a plain JavaScript object
        const role = newRole.toObject();

        // Send the role data
        return {
            success: true,
            statusCode: httpStatus.CREATED,
            message: 'Role created successfully.',
            data: role,
        };
    } catch (error) {
        return {
            success: false,
            statusCode: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error on RoleService.createRole()',
            data: null,
        };
    }
};

const RoleService = {
    createRole,
};

export default RoleService;
