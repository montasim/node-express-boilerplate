import Joi from 'joi';

import CustomValidation from '../../validations/custom.validation.js';

const createPermission = {
    body: Joi.object().keys({
        name: Joi.string()
            .required()
            .min(3)
            .message('Permission name must be at least 3 characters long')
            .max(50)
            .message('Permission name must be less than 50 characters long')
            .pattern(/^[a-z]+-(create|modify|get|update|delete)$/)
            .message(
                'Permission name must follow the pattern: modelName-(create|modify|get|update|delete), where modelName consists of lowercase letters only.'
            )
            .messages({
                'string.empty': 'Please add the permission name',
                'string.min':
                    'Permission name must be at least 3 characters long',
                'string.max':
                    'Permission name must be less than 50 characters long',
                'any.required': 'Permission name is required',
                'string.pattern.base':
                    'Permission name must follow the pattern: modelName-(create|modify|get|update|delete), where modelName consists of lowercase letters only. Actions must be one of create, modify, get, update, or delete.',
            }),
        isActive: Joi.bool().valid(true, false).required().messages({
            'boolean.base': 'isActive must be a boolean value',
            'any.only': 'isActive must be either true or false',
            'any.required': 'isActive is required',
        }),
    }),
};

const getPermissions = {
    query: Joi.object()
        .keys({
            name: Joi.string().max(50),
            isActive: Joi.string().valid('true', 'false'),
            createdBy: Joi.string(),
            updatedBy: Joi.string(),
            createdAt: Joi.string().isoDate(),
            updatedAt: Joi.string().isoDate(),
            sortBy: Joi.string().valid('name', 'createdAt', 'updatedAt'),
            limit: Joi.number().integer().min(1).max(100),
            page: Joi.number().integer().min(1),
        })
        .messages({
            // Default message for the entire object in case of any other unforeseen validation errors.
            'object.unknown': 'You have used an unknown parameter.',
        }),
};

const getPermission = {
    params: Joi.object().keys({
        permissionId: Joi.string()
            .custom(CustomValidation.detailedIdValidator)
            .required(),
    }),
};

const updatePermission = {
    params: Joi.object().keys({
        permissionId: Joi.string()
            .custom(CustomValidation.detailedIdValidator)
            .required(),
    }),
    body: Joi.object()
        .keys({
            name: Joi.string()
                .min(3)
                .message('Permission name must be at least 3 characters long.')
                .max(50)
                .message(
                    'Permission name must be less than 50 characters long.'
                )
                .pattern(/^[a-z]+-(create|modify|get|update|delete)$/)
                .message(
                    'Permission name must follow the pattern: modelName-(create|modify|get|update|delete), where modelName consists of lowercase letters only and the action must be one of the following: create, modify, get, update, or delete.'
                )
                .messages({
                    'string.empty': 'Please add the permission name.',
                    'string.min':
                        'Permission name must be at least 3 characters long.',
                    'string.max':
                        'Permission name must be less than 50 characters long.',
                    'any.required': 'Permission name is required.',
                    'string.pattern.base':
                        'Permission name must follow the pattern: modelName-(create|modify|get|update|delete). ModelName should consist of lowercase letters only and be followed by a valid action: create, modify, get, update, or delete.',
                }),
            isActive: Joi.bool().valid(true, false).messages({
                'boolean.base': 'isActive must be a boolean value.',
                'any.only': 'isActive must be either true or false.',
                'any.required': 'isActive status is required.',
            }),
        })
        .or('name', 'isActive')
        .messages({
            'object.min': 'At least one field must be provided for update.',
        }),
};

const deletePermission = {
    params: Joi.object().keys({
        permissionId: Joi.string()
            .custom(CustomValidation.detailedIdValidator)
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
