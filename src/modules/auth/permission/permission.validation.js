import Joi from 'joi';

import PermissionConstants from './permission.constants.js';
import customValidation from '../../../validations/custom.validation.js';

const createPermission = {
    body: Joi.object().keys({
        name: customValidation
            .stringValidator(
                'permission',
                PermissionConstants.PERMISSION_NAME_PATTERN,
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
                PermissionConstants.PERMISSION_NAME_PATTERN,
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
        permissionId: customValidation.id().required(),
    }),
};

const updatePermission = {
    params: Joi.object().keys({
        permissionId: customValidation.id().required(),
    }),
    body: Joi.object()
        .keys({
            name: customValidation.stringValidator(
                'permission',
                PermissionConstants.PERMISSION_NAME_PATTERN,
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
        permissionId: customValidation.id().required(),
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
