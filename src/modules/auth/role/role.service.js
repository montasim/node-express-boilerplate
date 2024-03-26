import httpStatus from 'http-status';

import sendServiceResponse from '../../../utils/sendServiceResponse.js';

import RoleModel from './role.model.js';
import PermissionModel from '../permission/permission.model.js';
import RoleAggregationPipeline from './role.pipeline.js';
import constants from '../../../constants/constants.js';

const createRole = async (sessionUser, roleData) => {
    // Check if the role name already exists
    const existingRole = await RoleModel.findOne({
        name: roleData?.name,
    });

    // Throw an error if the role name already exists
    if (existingRole) {
        throw {
            statusCode: httpStatus.CONFLICT,
            message: 'Role name already exists. Please use a different name.',
        };
    }

    // Create a new role
    const createdBy = sessionUser?.id || constants.defaultUserId;
    const newRole = await RoleModel.create({
        ...roleData,
        createdBy: createdBy,
    });

    // Aggregation pipeline to fetch and populate the updated document
    const aggregationPipeline = RoleAggregationPipeline.getRole(newRole?.id);

    const populatedRole = await RoleModel.aggregate(aggregationPipeline);

    // Handle a case where the population fails
    if (populatedRole?.length === 0) {
        throw {
            statusCode: httpStatus.OK, // Consider if this should actually be an error state
            message: 'Role created but population failed.',
            data: newRole,
        };
    }

    return sendServiceResponse(
        httpStatus.CREATED,
        'Role created successfully.',
        populatedRole
    );
};

const getRoles = async (sessionUser, filter, options) => {
    // Set the default match stage
    let matchStage = { $match: {} };

    // Check if the filter options are available
    if (filter) {
        if (filter?.name) {
            // For partial match on the name field
            matchStage.$match.name = { $regex: filter?.name, $options: 'i' };
        }
        if (filter?.isActive !== undefined) {
            // For exact match on the isActive field
            matchStage.$match.isActive = filter?.isActive === 'true';
        }
        if (filter?.createdBy) {
            matchStage.$match.createdBy = filter?.createdBy;
        }
        if (filter?.updatedBy) {
            matchStage.$match.updatedBy = filter?.updatedBy;
        }
        if (filter?.createdAt) {
            const startOfDay = new Date(filter?.createdAt);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filter?.createdAt);
            endOfDay.setHours(23, 59, 59, 999);
            matchStage.$match.createdAt = {
                $gte: startOfDay,
                $lte: endOfDay,
            };
        }
        if (filter?.updatedAt) {
            const startOfDay = new Date(filter?.updatedAt);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filter?.updatedAt);
            endOfDay.setHours(23, 59, 59, 999);
            matchStage.$match.updatedAt = {
                $gte: startOfDay,
                $lte: endOfDay,
            };
        }
    }

    // Sorting options
    let sortStage = { $sort: { createdAt: -1 } }; // Default sort if no sortBy provided

    // Check if the sortBy options are available
    if (options?.sortBy) {
        const sortParts = options?.sortBy?.split(':');
        const sortField = sortParts[0];
        const sortOrder = sortParts[1] === 'desc' ? -1 : 1; // Default to ascending if not specified

        // Ensure only specific fields are sortable
        if (['name', 'createdAt', 'updatedAt'].includes(sortField)) {
            sortStage = { $sort: { [sortField]: sortOrder } };
        }
    }

    const limit = options?.limit ? parseInt(options?.limit, 10) : 10;
    const skip = options?.page ? (parseInt(options?.page, 10) - 1) * limit : 0;

    // Build the dynamic aggregation pipeline
    const aggregationPipeline = RoleAggregationPipeline.getRoles(
        matchStage,
        sortStage,
        skip,
        limit
    ); // Filter out empty stages

    // Fetch the roles using the aggregation pipeline
    const roles = await RoleModel.aggregate(aggregationPipeline);

    // Check if the role array is empty
    if (roles?.length === 0) {
        throw {
            statusCode: httpStatus.NOT_FOUND,
            message: 'No roles found.',
        };
    }

    const rolesData = {
        total: roles?.length,
        limit: limit,
        page: options?.page || 1,
        roles: roles,
    };

    // Send the roles data
    return sendServiceResponse(
        httpStatus.OK,
        'Roles found successfully.',
        rolesData
    );
};

const getRole = async roleId => {
    // Aggregation pipeline to fetch and populate the updated document
    const aggregationPipeline = RoleAggregationPipeline.getRole(roleId);

    const roles = await RoleModel.aggregate(aggregationPipeline);

    // Check if the populatedRole query returned a document
    if (roles?.length === 0) {
        throw {
            statusCode: httpStatus.NOT_FOUND,
            message: 'Role not found.',
        };
    }

    // Send the role data
    return sendServiceResponse(
        httpStatus.OK,
        'Role found successfully.',
        roles[0]
    );
};

const updateRole = async (sessionUser, roleId, roleData) => {
    // Find the old role
    const oldRole = await RoleModel.findOne({
        id: roleId,
    });

    // Check if the role was found
    if (!oldRole) {
        throw {
            statusCode: httpStatus.NOT_FOUND,
            message: 'Role not found. Please try again.',
        };
    }

    // Convert permissions to a set for easier checking
    const existingPermissionsSet = new Set(
        oldRole?.permissions?.map(p => p.permission)
    );

    // Get the existing permissions from the PermissionModel
    const existingPermissions = await PermissionModel.find();

    // Create a set of valid permission IDs for easy lookup
    const validPermissionIdsSet = new Set(
        existingPermissions?.map(perm => perm?.id)
    );

    // Handle addPermissions
    if (roleData?.addPermissions) {
        for (const { permission } of roleData.addPermissions) {
            // Check if the permission already exists in the role
            if (existingPermissionsSet?.has(permission)) {
                throw {
                    statusCode: httpStatus.BAD_REQUEST,
                    message: `Permission ${permission} already exists in the role.`,
                };
            }
            // Check if the permission to be added is a valid permission by checking against the validPermissionIdsSet
            else if (!validPermissionIdsSet.has(permission)) {
                throw {
                    statusCode: httpStatus.BAD_REQUEST,
                    message: `Permission ${permission} is not a valid permission ID.`,
                };
            } else {
                oldRole.permissions.push({ permission });
            }
        }
    }

    // Handle deletePermissions
    if (roleData?.deletePermissions) {
        for (const { permission } of roleData.deletePermissions) {
            if (!existingPermissionsSet?.has(permission)) {
                throw {
                    statusCode: httpStatus.BAD_REQUEST,
                    message: `Permission ${permission} does not exist in the role.`,
                };
            }
        }

        oldRole.permissions = oldRole?.permissions.filter(
            p =>
                !roleData.deletePermissions.some(
                    dp => dp?.permission === p?.permission
                )
        );
    }

    // Prepare the updated data
    const updatedBy = sessionUser?.id || constants.defaultUserId;
    const updateData = {
        ...oldRole.toObject(), // Convert the mongoose document to a plain JavaScript object
        updatedBy: updatedBy,
        updatedAt: new Date(),
    };

    // Remove properties not needed for update
    delete updateData?._id;
    delete updateData?.addPermissions;
    delete updateData?.deletePermissions;

    // Update the role using the custom roleId
    const updatedRole = await RoleModel.findOneAndUpdate(
        { id: roleId },
        updateData,
        { new: true, runValidators: true }
    );

    // Check if the role was updated
    if (!updatedRole) {
        throw {
            statusCode: httpStatus.NOT_FOUND,
            message: 'Failed to update role. Please try again.',
        };
    }

    // Aggregation pipeline to fetch and populate the updated document
    const aggregationPipeline = RoleAggregationPipeline.getRole(
        updatedRole?.id
    );

    // Fetch the updated role using the aggregation pipeline
    const populatedRole = await RoleModel.aggregate(aggregationPipeline);

    // Check if the populatedRole query returned a document
    if (!populatedRole || populatedRole?.length === 0) {
        throw {
            statusCode: httpStatus.OK,
            message: 'Role updated but population failed.',
        };
    }

    // Send the role data
    return sendServiceResponse(
        httpStatus.OK,
        'Role updated successfully.',
        populatedRole[0]
    );
};

const deleteRole = async roleId => {
    // Find the old role
    const oldRole = await RoleModel.findOne({
        id: roleId,
    });

    // Check if the role was found
    if (!oldRole) {
        throw {
            statusCode: httpStatus.NOT_FOUND,
            message: 'Role not found. Please try again.',
        };
    }

    // Update the role using the custom roleId
    const deleteRole = await RoleModel.findOneAndDelete(
        { id: roleId } // Use the custom id field for matching
    );

    // Check if the role was updated
    if (!deleteRole) {
        throw {
            statusCode: httpStatus.NOT_FOUND,
            message: 'Failed to delete role. Please try again.',
        };
    }

    // TODO: Automatically remove the deleted roles from all users
    // await UserModel.updateMany(
    //     { role: roleId }, // Finds all users with the deleted role
    //     { $pull: { role: roleId } } // Removes the deleted role from their roles array
    // );

    // Send the role data
    return sendServiceResponse(
        httpStatus.OK,
        'Role deleted successfully.',
        null
    );
};

const RoleService = {
    createRole,
    getRoles,
    getRole,
    updateRole,
    deleteRole,
};

export default RoleService;
