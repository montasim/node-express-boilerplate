import Joi from 'joi';

import CustomValidation from '../../validations/custom.validation.js';
import permissionConstraints from './permission.constants.js';

const createPermission = {
    body: Joi.object().keys({
        name: Joi.string()
            .required()
            .min(3)
            .message('Permission name must be at least 3 characters long')
            .max(50)
            .message('Permission name must be less than 50 characters long')
            .pattern(permissionConstraints.permissionNamePattern)
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
            name: Joi.string().max(50).messages({
                'string.base': 'Name must be a string.',
                'string.max': 'Name must not exceed 50 characters.',
            }),
            isActive: Joi.bool().valid(true, false).messages({
                'string.base': 'isActive must be a string.',
                'any.only': 'isActive must be either "true" or "false".',
            }),
            createdBy: Joi.string().messages({
                'string.base': 'createdBy must be a string.',
            }),
            updatedBy: Joi.string().messages({
                'string.base': 'updatedBy must be a string.',
            }),
            createdAt: Joi.string().isoDate().messages({
                'string.base': 'createdAt must be a string.',
                'string.isoDate': 'createdAt must be in ISO 8601 date format.',
            }),
            updatedAt: Joi.string().isoDate().messages({
                'string.base': 'updatedAt must be a string.',
                'string.isoDate': 'updatedAt must be in ISO 8601 date format.',
            }),
            sortBy: Joi.string()
                .valid('name', 'createdAt', 'updatedAt')
                .messages({
                    'string.base': 'sortBy must be a string.',
                    'any.only':
                        'sortBy must be one of the following: name, createdAt, updatedAt.',
                }),
            limit: Joi.number().integer().min(1).max(100).messages({
                'number.base': 'Limit must be a number.',
                'number.integer': 'Limit must be an integer.',
                'number.min': 'Limit must be at least 1.',
                'number.max': 'Limit must not exceed 100.',
            }),
            page: Joi.number().integer().min(1).messages({
                'number.base': 'Page must be a number.',
                'number.integer': 'Page must be an integer.',
                'number.min': 'Page must be at least 1.',
            }),
        })
        .messages({
            'object.unknown':
                'You have used an unknown parameter. Please check your request against the API documentation.',
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
                .pattern(permissionConstraints.permissionNamePattern)
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
