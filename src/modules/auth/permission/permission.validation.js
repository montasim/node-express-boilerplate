import Joi from 'joi';

import customValidation from '../../../validations/custom.validation.js';
import constants from '../../../constants/constants.js';

const createPermission = {
    body: Joi.object().keys({
        name: customValidation
            .stringValidator(
                'permission',
                constants.permissionNamePattern,
                3,
                50
            )
            .required(),
        isActive: customValidation.isActive().required(),
    }),
};

const getPermissions = {
    query: Joi.object()
        .keys({
            name: customValidation.stringValidator(
                'permission',
                constants.permissionNamePattern,
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

const getPermission = {
    params: Joi.object().keys({
        permissionId: customValidation
            .id(constants.permissionNamePattern)
            .required(),
    }),
};

const updatePermission = {
    params: Joi.object().keys({
        permissionId: customValidation
            .id(constants.permissionNamePattern)
            .required(),
    }),
    body: Joi.object()
        .keys({
            name: customValidation.stringValidator(
                'permission',
                constants.permissionNamePattern,
                3,
                50
            ),
            isActive: customValidation.isActive(),
        })
        .or('name', 'isActive')
        .messages({
            'object.min': 'At least one field must be provided for update.',
        }),
};

const deletePermission = {
    params: Joi.object().keys({
        permissionId: customValidation
            .id(constants.permissionNamePattern)
            .required(),
    }),
};

const PermissionValidation = {
    createPermission,
    getPermissions,
    getPermission,
    updatePermission,
    deletePermission,
};

export default PermissionValidation;
