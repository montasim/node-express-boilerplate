import httpStatus from 'http-status';

import setDefaultSessionUser from '../../../utils/setDefaultSessionUser.js';
import sendServiceResponse from '../../../utils/sendServiceResponse.js';
import newServiceErrorHandler from '../../../utils/newServiceErrorHandler.js';

import PermissionModel from './permission.model.js';
import RoleModel from '../role/role.model.js';
import mongodbAggregationPipelineHelpers from '../../../utils/mongodbAggregationPipelineHelpers.js';

const createPermission = async (sessionUser, permissionData) => {
    try {
        // Validate session user
        const currentSessionUser = await setDefaultSessionUser(sessionUser);
        if (!currentSessionUser?.id) {
            throw {
                statusCode: httpStatus.FORBIDDEN,
                message: 'You are not authorized to perform this action.',
            };
        }

        // Create the permission with added createdBy field
        const createdBy = 'user-20240317230608-000000001'; // Example user ID or derive from sessionUser
        const newPermission = await PermissionModel.create({
            ...permissionData,
            createdBy,
        });

        // Define role names
        const roleNames = ['Admin', 'Super Admin'];

        // Process each role
        await Promise.all(
            roleNames.map(async roleName => {
                let role = await RoleModel.findOne({ name: roleName }).lean();

                if (!role) {
                    // If the role does not exist, create it with the new permission and isActive status
                    role = await RoleModel.create({
                        name: roleName,
                        permissions: [{ permission: newPermission?.id }],
                        createdBy,
                        isActive: true,
                    });
                } else {
                    // If the role exists, add the new permission ID to its permissions using $addToSet to avoid duplicates
                    await RoleModel.updateOne(
                        { id: role?.id },
                        {
                            $addToSet: {
                                permissions: { permission: newPermission?.id },
                            },
                        } // Ensure permissions are added as objects
                    );
                }
            })
        );

        // Aggregation pipeline to fetch and populate the updated document
        const aggregationPipeline =
            mongodbAggregationPipelineHelpers.createdByUpdatedByAggregationPipeline(
                newPermission?.id
            );

        const populatedPermission =
            await PermissionModel.aggregate(aggregationPipeline);

        // Handle a case where the population fails
        if (populatedPermission.length === 0) {
            throw {
                statusCode: httpStatus.OK, // Consider if this should actually be an error state
                message: 'Permission created but population failed.',
                data: newPermission,
            };
        }

        return sendServiceResponse(
            httpStatus.CREATED,
            'Permission created successfully.',
            populatedPermission
        );
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const getPermissions = async (sessionUser, filter, options) => {
    try {
        // Set the default match stage
        let matchStage = { $match: {} };

        // Check if the filter options are available
        if (filter) {
            if (filter.name) {
                // For partial match on the name field
                matchStage.$match.name = { $regex: filter.name, $options: 'i' };
            }
            if (filter.isActive !== undefined) {
                // For exact match on the isActive field
                matchStage.$match.isActive = filter.isActive === 'true';
            }
            if (filter.createdBy) {
                matchStage.$match.createdBy = filter.createdBy;
            }
            if (filter.updatedBy) {
                matchStage.$match.updatedBy = filter.updatedBy;
            }
            if (filter.createdAt) {
                const startOfDay = new Date(filter.createdAt);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(filter.createdAt);
                endOfDay.setHours(23, 59, 59, 999);
                matchStage.$match.createdAt = {
                    $gte: startOfDay,
                    $lte: endOfDay,
                };
            }
            if (filter.updatedAt) {
                const startOfDay = new Date(filter.updatedAt);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(filter.updatedAt);
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
        if (options.sortBy) {
            const sortParts = options.sortBy.split(':');
            const sortField = sortParts[0];
            const sortOrder = sortParts[1] === 'desc' ? -1 : 1; // Default to ascending if not specified

            // Ensure only specific fields are sortable
            if (['name', 'createdAt', 'updatedAt'].includes(sortField)) {
                sortStage = { $sort: { [sortField]: sortOrder } };
            }
        }

        const limit = options.limit ? parseInt(options.limit, 10) : 10;
        const skip = options.page
            ? (parseInt(options.page, 10) - 1) * limit
            : 0;

        // Build the dynamic aggregation pipeline
        const aggregationPipeline = [
            matchStage,
            {
                $lookup: {
                    from: 'users',
                    let: { createdByVar: '$createdBy' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$id', '$$createdByVar'] },
                            },
                        },
                        {
                            $project: {
                                __v: 0,
                                _id: 0,
                                id: 0,
                                role: 0,
                                password: 0,
                                isEmailVerified: 0,
                                picture: { fileId: 0, shareableLink: 0 },
                            },
                        }, // Exclude the __v, _id, id, role, password, isEmailVerified, picture field from the lookup result
                    ],
                    as: 'createdByUser',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    let: { updatedByVar: '$updatedBy' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$id', '$$updatedByVar'] },
                            },
                        },
                        {
                            $project: {
                                __v: 0,
                                _id: 0,
                                id: 0,
                                role: 0,
                                password: 0,
                                isEmailVerified: 0,
                                picture: { fileId: 0, shareableLink: 0 },
                            },
                        }, // Exclude the __v, _id, id, role, password, isEmailVerified, picture field from the lookup result
                    ],
                    as: 'updatedByUser',
                },
            },
            {
                $unwind: {
                    path: '$createdByUser',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $unwind: {
                    path: '$updatedByUser',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    createdBy: '$createdByUser',
                    updatedBy: '$updatedByUser',
                },
            },
            {
                $project: {
                    _id: 0,
                    __v: 0,
                    createdByUser: 0,
                    updatedByUser: 0,
                },
            },
            sortStage,
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    __v: 0,
                    createdByUser: 0,
                    updatedByUser: 0,
                },
            },
        ].filter(stage => Object.keys(stage).length); // Filter out empty stages

        // Fetch the permissions using the aggregation pipeline
        const permissions =
            await PermissionModel.aggregate(aggregationPipeline);

        // Check if the permissions array is empty
        if (permissions?.length === 0) {
            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'No permissions found.',
            };
        }

        const permissionsData = {
            total: permissions.length,
            limit: limit,
            page: options.page || 1,
            permissions: permissions,
        };

        // Send the permissions data
        return sendServiceResponse(
            httpStatus.OK,
            'Permissions found successfully.',
            permissionsData
        );
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const getPermission = async permissionId => {
    try {
        // Aggregation pipeline to fetch and populate the updated document
        const aggregationPipeline =
            mongodbAggregationPipelineHelpers.createdByUpdatedByAggregationPipeline(
                permissionId
            );

        const permissions =
            await PermissionModel.aggregate(aggregationPipeline);

        // Check if the populatedPermission query returned a document
        if (permissions?.length === 0) {
            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'Permission not found.',
            };
        }

        // Send the permission data
        return sendServiceResponse(
            httpStatus.OK,
            'Permission found successfully.',
            permissions[0]
        );
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const updatePermission = async (sessionUser, permissionId, permissionData) => {
    try {
        // Set the default session user
        let currentSessionUser = await setDefaultSessionUser(sessionUser);

        // Check if the current session user is available
        if (!currentSessionUser?.id) {
            throw {
                statusCode: httpStatus.FORBIDDEN,
                message: 'You are not authorized to perform this action.',
            };
        }

        // Find the old permission
        const oldPermission = await PermissionModel.findOne({
            id: permissionId,
        });

        // Check if the permission was found
        if (!oldPermission) {
            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'Permission not found. Please try again.',
            };
        }

        // Assuming that initially, the data is the same
        let isDataSame = true;

        // Checking for changes in the permissionData
        for (const [key, value] of Object.entries(permissionData)) {
            if (JSON.stringify(oldPermission[key]) !== JSON.stringify(value)) {
                isDataSame = false;
                break;
            }
        }

        // Check if the data is the same
        if (isDataSame) {
            throw {
                statusCode: httpStatus.BAD_REQUEST,
                message: 'No changes detected. Update not performed.',
            };
        }

        // Prepare the updated data
        const updateData = {
            ...permissionData,
            updatedBy: 'user-20240317230608-000000001', // Assuming you're passing the current user's ID
            updatedAt: new Date(),
        };

        // Update the permission using the custom permissionId
        const updatedPermission = await PermissionModel.findOneAndUpdate(
            { id: permissionId },
            updateData,
            { new: true, runValidators: true }
        );

        // Check if the permission was updated
        if (!updatedPermission) {
            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'Failed to update permission. Please try again.',
            };
        }

        // Aggregation pipeline to fetch and populate the updated document
        const aggregationPipeline =
            mongodbAggregationPipelineHelpers.createdByUpdatedByAggregationPipeline(
                permissionId
            );

        // Fetch the updated permission using the aggregation pipeline
        const populatedPermission =
            await PermissionModel.aggregate(aggregationPipeline);

        // Check if the populatedPermission query returned a document
        if (!populatedPermission || populatedPermission?.length === 0) {
            throw {
                statusCode: httpStatus.OK,
                message: 'Permission updated but population failed.',
            };
        }

        // Send the permission data
        return sendServiceResponse(
            httpStatus.OK,
            'Permission updated successfully.',
            populatedPermission[0]
        );
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const deletePermission = async permissionId => {
    try {
        // Find the old permission
        const oldPermission = await PermissionModel.findOne({
            id: permissionId,
        });

        // Check if the permission was found
        if (!oldPermission) {
            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'Permission not found. Please try again.',
            };
        }

        // Update the permission using the custom permissionId
        const deletePermission = await PermissionModel.findOneAndDelete(
            { id: permissionId } // Use the custom id field for matching
        );

        // Check if the permission was updated
        if (!deletePermission) {
            throw {
                statusCode: httpStatus.NOT_FOUND,
                message: 'Failed to delete permission. Please try again.',
            };
        }

        // Remove the permission from all roles
        // The $pull operator removes from an existing array all instances of a value or values that match a specified condition
        await RoleModel.updateMany(
            {}, // An empty filter object {} means "match all documents in the collection"
            { $pull: { permissions: { permission: permissionId } } }
        );

        // Send the permission data
        return sendServiceResponse(
            httpStatus.OK,
            'Permission deleted successfully.',
            null
        );
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const PermissionService = {
    createPermission,
    getPermissions,
    getPermission,
    updatePermission,
    deletePermission,
};

export default PermissionService;
