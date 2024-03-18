import Joi from 'joi';

import RoleConstants from './role.constants.js';
import customValidation from '../../validations/custom.validation.js';
import constants from '../../constants/constants.js';

const createRole = {
    body: Joi.object().keys({
        name: customValidation
            .stringValidator('role', RoleConstants.ROLE_NAME_PATTERN, 3, 50)
            .required(),
        permissions: Joi.array()
            .items(Joi.string().pattern(constants.customIdPattern)) // Example pattern for MongoDB ObjectId validation
            .required()
            .messages({
                'array.base': 'Permissions must be an array of valid IDs.',
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
                RoleConstants.ROLE_NAME_PATTERN,
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
        roleId: customValidation.id().required(),
    }),
};

const updateRole = {
    params: Joi.object().keys({
        roleId: customValidation.id().required(),
    }),
    body: Joi.object()
        .keys({
            name: customValidation.stringValidator(
                'role',
                RoleConstants.ROLE_NAME_PATTERN,
                3,
                50
            ),
            permissions: Joi.array()
                .items(Joi.string().pattern(constants.customIdPattern)) // Example pattern for MongoDB ObjectId validation
                .messages({
                    'array.base': 'Permissions must be an array of valid IDs.',
                    'string.pattern.base':
                        'Each permission must be a valid ID.',
                }),
            isActive: customValidation.isActive(),
        })
        .or('name', 'permissions', 'isActive')
        .messages({
            'object.min': 'At least one field must be provided for update.',
        }),
};

const deleteRole = {
    params: Joi.object().keys({
        roleId: customValidation.id().required(),
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
