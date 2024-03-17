import httpStatus from 'http-status';

import setDefaultSessionUser from '../../utils/setDefaultSessionUser.js';

import PermissionModel from './permission.model.js';
import UserModel from '../user/user.model.js';

const createPermission = async (sessionUser, permissionData) => {
    try {
        let currentSessionUser = await setDefaultSessionUser(sessionUser);

        // Check if the current session user is available
        if (!currentSessionUser?.id) {
            return {
                success: false,
                statusCode: httpStatus.FORBIDDEN,
                message: 'You are not authorized to perform this action',
                data: null,
            };
        }

        // Create the permission
        const newPermission = await PermissionModel.create({
            ...permissionData,
            createdBy: 'user-20240317230608-000000001',
        });

        // Check if the permission was created
        if (!newPermission) {
            return {
                success: false,
                statusCode: httpStatus.BAD_REQUEST,
                message: 'Failed to create permission. Please try again.',
                data: null,
            };
        }

        // Convert the Mongoose document to a plain JavaScript object
        const permission = newPermission.toObject();

        // Send the permission data
        return {
            success: true,
            statusCode: httpStatus.CREATED,
            message: 'Permission created successfully.',
            data: permission,
        };
    } catch (error) {
        return {
            success: false,
            statusCode: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error on PermissionService.createPermission()',
            data: null,
        };
    }
};

const getPermission = async (permissionId) => {
    try {
        // Find the permission without population
        const permission = await PermissionModel.findOne({ id: permissionId });

        // Check if the permission was found
        if (!permission) {
            return {
                success: false,
                statusCode: httpStatus.NOT_FOUND,
                message: 'Permission not found. Please try again.',
                data: null,
            };
        }

        // Manually populate createdBy and updatedBy fields
        const createdByUser = await UserModel.findOne({ id: permission.createdBy });
        const updatedByUser = await UserModel.findOne({ id: permission.updatedBy });

        // Add populated user details to permission object
        // Ensure not to overwrite original mongoose document fields
        const populatedPermission = permission.toObject();
        populatedPermission.createdBy = createdByUser;
        populatedPermission.updatedBy = updatedByUser;

        // Send the permission data with manually populated createdBy and updatedBy details
        return {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Permission found successfully.',
            data: populatedPermission,
        };
    } catch (error) {
        return {
            success: false,
            statusCode: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error on PermissionService.getPermission()',
            data: null,
        };
    }
};

const updatePermission = async (sessionUser, permissionId, permissionData) => {
    try {
        let currentSessionUser = await setDefaultSessionUser(sessionUser);

        // Check if the current session user is available
        if (!currentSessionUser?.id) {
            return {
                success: false,
                statusCode: httpStatus.FORBIDDEN,
                message: 'You are not authorized to perform this action',
                data: null,
            };
        }

        // Find the old permission
        const oldPermission = await PermissionModel.findOne({
            id: permissionId
        });

        // Check if the permission was found
        if (!oldPermission) {
            return {
                success: false,
                statusCode: httpStatus.NOT_FOUND,
                message: 'Permission not found. Please try again.',
                data: null,
            };
        }

        // Dynamically check if old data and new data are the same
        let isDataSame = true;
        for (const [key, value] of Object.entries(permissionData)) {
            if (JSON.stringify(oldPermission[key]) !== JSON.stringify(value)) {
                isDataSame = false;
                break; // No need to continue checking if we found at least one difference
            }
        }

        // If the old data and new data is the same, return an error
        if (isDataSame) {
            return {
                success: false,
                statusCode: httpStatus.BAD_REQUEST,
                message: 'No changes detected. Update not performed.',
                data: null,
            };
        }

        // Prepare the update data
        const updateData = {
            ...permissionData,
            updatedBy: 'user-20240317230608-000000001',
            updatedAt: new Date(), // Ensure updatedAt is set to current time
        };

        // Update the permission using the custom permissionId
        const updatedPermission = await PermissionModel.findOneAndUpdate(
            { id: permissionId }, // Use the custom id field for matching
            updateData,
            {
                new: true,
                runValidators: true
            } // Return the updated document and run schema validators
        );

        // Check if the permission was updated
        if (!updatedPermission) {
            return {
                success: false,
                statusCode: httpStatus.NOT_FOUND,
                message: 'Failed to update permission. Please try again.',
                data: null,
            };
        }

        // Send the updated permission data
        return {
            success: true,
            statusCode: httpStatus.OK, // Use 200 OK for updates
            message: 'Permission updated successfully.',
            data: updatedPermission, // Already a plain object if using { new: true }
        };
    } catch (error) {
        return {
            success: false,
            statusCode: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error on PermissionService.updatePermission()',
            data: null,
        };
    }
};

const deletePermission = async (permissionId) => {
    try {
        // Find the old permission
        const oldPermission = await PermissionModel.findOne({
            id: permissionId
        });

        // Check if the permission was found
        if (!oldPermission) {
            return {
                success: false,
                statusCode: httpStatus.NOT_FOUND,
                message: 'Permission not found. Please try again.',
                data: null,
            };
        }

        // Update the permission using the custom permissionId
        const deletePermission = await PermissionModel.findOneAndDelete(
            { id: permissionId }, // Use the custom id field for matching
        );

        // Check if the permission was updated
        if (!deletePermission) {
            return {
                success: false,
                statusCode: httpStatus.NOT_FOUND,
                message: 'Failed to delete permission. Please try again.',
                data: null,
            };
        }

        // Send the updated permission data
        return {
            success: true,
            statusCode: httpStatus.OK, // Use 200 OK for updates
            message: 'Permission deleted successfully.',
            data: null, // Already a plain object if using { new: true }
        };
    } catch (error) {
        return {
            success: false,
            statusCode: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error on PermissionService.deletePermission()',
            data: null,
        };
    }
};

const PermissionService = {
    createPermission,
    getPermission,
    updatePermission,
    deletePermission,
};

export default PermissionService;
