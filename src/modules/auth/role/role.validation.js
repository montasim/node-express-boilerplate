import Joi from 'joi';

import customValidation from '../../../validations/custom.validation.js';
import constants from '../../../constants/constants.js';

const createRole = {
    body: Joi.object().keys({
        name: customValidation
            .stringValidator('role', constants.roleIdPattern, 3, 50)
            .required(),
        permissions: Joi.array()
            .items(
                Joi.object({
                    permission: customValidation.id(
                        constants.permissionIdPattern
                    ),
                }).required()
            )
            // Here we apply a custom validation to ensure that each "permission" in the array is unique.
            .custom((permissions, helper) => {
                const permissionsSet = new Set(
                    permissions.map(p => p.permission)
                );
                if (permissionsSet.size !== permissions.length) {
                    return helper.message('Each permission must be unique.');
                }
                return permissions; // Return the original array if validation passes
            }, 'Unique Permissions Validation')
            .required()
            .messages({
                'array.base':
                    'Permissions must be an array of valid permission objects.',
                'object.base':
                    'Each item in the permissions array must be an object.',
                'string.pattern.base': 'Each permission must be a valid ID.',
            }),
        isActive: customValidation.isActive().required(),
    }),
};

const getRoles = {
    query: Joi.object()
        .keys({
            name: customValidation.stringValidator(
                'role',
                constants.roleIdPattern,
                3,
                50
            ),
            isActive: customValidation.isActive(),
            createdBy: customValidation.createdBy(),
            updatedBy: customValidation.updatedBy(),
            createdAt: customValidation.createdAt(),
            updatedAt: customValidation.updatedAt(),
            sortBy: customValidation.sortBy(),
            limit: customValidation.limit(),
            page: customValidation.page(),
        })
        .messages(customValidation.queryErrorMessages()),
};

const getRole = {
    params: Joi.object().keys({
        roleId: customValidation.id(constants.roleIdPattern).required(),
    }),
};

const updateRole = {
    params: Joi.object().keys({
        roleId: customValidation.id(constants.roleIdPattern).required(),
    }),
    body: Joi.object()
        .keys({
            name: customValidation.stringValidator(
                'role',
                constants.roleIdPattern,
                3,
                50
            ),
            addPermissions: Joi.array()
                .items(
                    Joi.object({
                        permission: customValidation.id(
                            constants.permissionIdPattern
                        ),
                    }).required()
                )
                .custom((permissions, helper) => {
                    const permissionsSet = new Set(
                        permissions.map(p => p.permission)
                    );
                    if (permissionsSet.size !== permissions.length) {
                        return helper.message(
                            'Each permission in addPermissions must be unique.'
                        );
                    }
                    return permissions;
                }, 'Unique Add Permissions Validation')
                .messages({
                    'array.base':
                        'addPermissions must be an array of valid permission objects.',
                    'object.base':
                        'Each item in the addPermissions array must be an object.',
                    'string.pattern.base':
                        'Each permission must be a valid ID.',
                }),
            deletePermissions: Joi.array()
                .items(
                    Joi.object({
                        permission: customValidation.id(
                            constants.permissionIdPattern
                        ),
                    }).required()
                )
                .custom((permissions, helper) => {
                    const permissionsSet = new Set(
                        permissions.map(p => p.permission)
                    );
                    if (permissionsSet.size !== permissions.length) {
                        return helper.message(
                            'Each permission in deletePermissions must be unique.'
                        );
                    }
                    return permissions;
                }, 'Unique Delete Permissions Validation')
                .messages({
                    'array.base':
                        'deletePermissions must be an array of valid permission objects.',
                    'object.base':
                        'Each item in the deletePermissions array must be an object.',
                    'string.pattern.base':
                        'Each permission must be a valid ID.',
                }),
            isActive: customValidation.isActive(),
        })
        .custom((body, helper) => {
            const addPermissions =
                body.addPermissions?.map(p => p.permission) || [];
            const deletePermissions =
                body.deletePermissions?.map(p => p.permission) || [];

            const commonPermissions = addPermissions.filter(permission =>
                deletePermissions.includes(permission)
            );
            if (commonPermissions.length > 0) {
                return helper.message(
                    'addPermissions and deletePermissions must not contain the same permissions.'
                );
            }

            return body; // Return the original body if validation passes
        }, 'Permissions Intersection Validation')
        .or('name', 'addPermissions', 'deletePermissions', 'isActive')
        .messages({
            'object.min': 'At least one field must be provided for update.',
        }),
};

const deleteRole = {
    params: Joi.object().keys({
        roleId: customValidation.id(constants.roleIdPattern).required(),
    }),
};

const RoleValidation = {
    createRole,
    getRoles,
    getRole,
    updateRole,
    deleteRole,
};

export default RoleValidation;
