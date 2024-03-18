import httpStatus from 'http-status';

import setDefaultSessionUser from '../../utils/setDefaultSessionUser.js';

import PermissionModel from './permission.model.js';

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

        // Aggregation pipeline to fetch and populate the updated document
        const aggregationPipeline = [
            {
                $match: { id: newPermission?.id }, // Match the permission document
            },
            {
                $lookup: {
                    from: 'users',
                    let: { createdByVar: '$createdBy' }, // Define variable for use in pipeline
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$id', '$$createdByVar'] },
                            },
                        }, // Use the variable to match the user
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
        ];

        const populatedPermission =
            await PermissionModel.aggregate(aggregationPipeline);

        // Check if the populatedPermission query returned a document
        if (!populatedPermission || populatedPermission.length === 0) {
            return {
                success: true,
                statusCode: httpStatus.OK,
                message: 'Permission created but population failed.',
                data: newPermission,
            };
        }

        // Send the permission data
        return {
            success: true,
            statusCode: httpStatus.CREATED,
            message: 'Permission created successfully.',
            data: populatedPermission,
        };
    } catch (error) {
        return {
            success: false,
            statusCode: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
            message:
                error.message ||
                'Internal server error on PermissionService.createPermission()',
            data: null,
        };
    }
};

const getPermissions = async (sessionUser, filter, options) => {
    try {
        let matchStage = { $match: {} };

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

        const permissions =
            await PermissionModel.aggregate(aggregationPipeline);

        if (permissions?.length === 0) {
            return {
                success: false,
                statusCode: httpStatus.NOT_FOUND,
                message: 'No permissions found.',
                data: null,
            };
        }

        return {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Permissions found successfully.',
            data: {
                total: permissions.length,
                limit: limit,
                page: options.page || 1,
                permissions: permissions,
            },
        };
    } catch (error) {
        return {
            success: false,
            statusCode: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
            message:
                error.message ||
                'Internal server error on PermissionService.getPermissions()',
            data: null,
        };
    }
};

const getPermission = async permissionId => {
    try {
        const aggregationPipeline = [
            {
                $match: { id: permissionId }, // Match the permission document
            },
            {
                $lookup: {
                    from: 'users',
                    let: { createdByVar: '$createdBy' }, // Define variable for use in pipeline
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$id', '$$createdByVar'] },
                            },
                        }, // Use the variable to match the user
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
        ];

        const permissions =
            await PermissionModel.aggregate(aggregationPipeline);

        if (permissions.length === 0) {
            return {
                success: false,
                statusCode: httpStatus.NOT_FOUND,
                message: 'Permission not found.',
                data: null,
            };
        }

        return {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Permission found successfully.',
            data: permissions[0], // Assuming you're looking for a single permission
        };
    } catch (error) {
        return {
            success: false,
            statusCode: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
            message:
                error.message ||
                'Internal server error on PermissionService.getPermission()',
            data: null,
        };
    }
};

const updatePermission = async (sessionUser, permissionId, permissionData) => {
    try {
        let currentSessionUser = await setDefaultSessionUser(sessionUser);

        if (!currentSessionUser?.id) {
            return {
                success: false,
                statusCode: httpStatus.FORBIDDEN,
                message: 'You are not authorized to perform this action',
                data: null,
            };
        }

        const oldPermission = await PermissionModel.findOne({
            id: permissionId,
        });
        if (!oldPermission) {
            return {
                success: false,
                statusCode: httpStatus.NOT_FOUND,
                message: 'Permission not found. Please try again.',
                data: null,
            };
        }

        let isDataSame = true;
        for (const [key, value] of Object.entries(permissionData)) {
            if (JSON.stringify(oldPermission[key]) !== JSON.stringify(value)) {
                isDataSame = false;
                break;
            }
        }

        if (isDataSame) {
            return {
                success: false,
                statusCode: httpStatus.BAD_REQUEST,
                message: 'No changes detected. Update not performed.',
                data: null,
            };
        }

        const updateData = {
            ...permissionData,
            updatedBy: 'user-20240317230608-000000001', // Assuming you're passing the current user's ID
            updatedAt: new Date(),
        };

        const updatedPermission = await PermissionModel.findOneAndUpdate(
            { id: permissionId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedPermission) {
            return {
                success: false,
                statusCode: httpStatus.NOT_FOUND,
                message: 'Failed to update permission. Please try again.',
                data: null,
            };
        }

        // Aggregation pipeline to fetch and populate the updated document
        const aggregationPipeline = [
            {
                $match: { id: permissionId }, // Match the permission document
            },
            {
                $lookup: {
                    from: 'users',
                    let: { createdByVar: '$createdBy' }, // Define variable for use in pipeline
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$id', '$$createdByVar'] },
                            },
                        }, // Use the variable to match the user
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
        ];

        const populatedPermission =
            await PermissionModel.aggregate(aggregationPipeline);

        // Check if the populatedPermission query returned a document
        if (!populatedPermission || populatedPermission.length === 0) {
            return {
                success: true,
                statusCode: httpStatus.OK,
                message: 'Permission updated but population failed.',
                data: updatedPermission,
            };
        }

        return {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Permission updated successfully.',
            data: populatedPermission[0], // Assuming only one document matches the criteria
        };
    } catch (error) {
        return {
            success: false,
            statusCode: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
            message:
                error.message ||
                'Internal server error on PermissionService.updatePermission()',
            data: null,
        };
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
            return {
                success: false,
                statusCode: httpStatus.NOT_FOUND,
                message: 'Permission not found. Please try again.',
                data: null,
            };
        }

        // Update the permission using the custom permissionId
        const deletePermission = await PermissionModel.findOneAndDelete(
            { id: permissionId } // Use the custom id field for matching
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
            message:
                error.message ||
                'Internal server error on PermissionService.deletePermission()',
            data: null,
        };
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
