import httpStatus from 'http-status';

import setDefaultSessionUser from '../../utils/setDefaultSessionUser.js';
import sendServiceResponse from '../../utils/sendServiceResponse.js';
import newServiceErrorHandler from '../../utils/newServiceErrorHandler.js';

import RoleModel from './role.model.js';
import mongodbAggregationPipelineHelpers from '../../utils/mongodbAggregationPipelineHelpers.js';

const createRole = async (sessionUser, roleData) => {
    try {
        // Validate session user
        const currentSessionUser = await setDefaultSessionUser(sessionUser);
        if (!currentSessionUser?.id) {
            throw {
                statusCode: httpStatus.FORBIDDEN,
                message: 'You are not authorized to perform this action.',
            };
        }

        // Create the role with added createdBy field
        const createdBy = 'user-20240317230608-000000001'; // Example user ID or derive from sessionUser
        const newRole = await RoleModel.create({
            ...roleData,
            createdBy,
        });

        // Aggregation pipeline to fetch and populate the updated document
        const aggregationPipeline =
            mongodbAggregationPipelineHelpers.createAggregationPipeline(
                newRole?.id
            );

        const populatedRole = await RoleModel.aggregate(aggregationPipeline);

        // Handle a case where the population fails
        if (populatedRole.length === 0) {
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
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const getRoles = async (sessionUser, filter, options) => {
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
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const getRole = async roleId => {
    try {
        // Aggregation pipeline to fetch and populate the updated document
        const aggregationPipeline =
            mongodbAggregationPipelineHelpers.createAggregationPipeline(roleId);

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
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const updateRole = async (sessionUser, roleId, roleData) => {
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

        // Assuming that initially, the data is the same
        let isDataSame = true;

        // Checking for changes in the roleData
        for (const [key, value] of Object.entries(roleData)) {
            if (JSON.stringify(oldRole[key]) !== JSON.stringify(value)) {
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
            ...roleData,
            updatedBy: 'user-20240317230608-000000001', // Assuming you're passing the current user's ID
            updatedAt: new Date(),
        };

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
        const aggregationPipeline =
            mongodbAggregationPipelineHelpers.createAggregationPipeline(roleId);

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
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const deleteRole = async roleId => {
    try {
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

        // Send the role data
        return sendServiceResponse(
            httpStatus.OK,
            'Role deleted successfully.',
            null
        );
    } catch (error) {
        return newServiceErrorHandler(error);
    }
};

const RoleService = {
    createRole,
    getRoles,
    getRole,
    updateRole,
    deleteRole,
};

export default RoleService;
