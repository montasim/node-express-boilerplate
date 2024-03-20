import Joi from 'joi';

import CustomValidation from '../../validations/custom.validation.js';
import customValidation from '../../validations/custom.validation.js';
import UserConstants from './user.constant.js';

const createUser = {
    body: Joi.object().keys({
        email: Joi.string()
            .trim()
            .email()
            .required()
            .external(CustomValidation.email),
        password: Joi.string().required().external(CustomValidation.password),
        name: customValidation
            .stringValidator('user', UserConstants.USER_NAME_PATTERN, 3, 50)
            .required(),
        role: customValidation.id().trim(),
    }),
};

const getUsers = {
    query: Joi.object().keys({
        name: Joi.string().trim(),
        role: Joi.string().trim(),
        sortBy: Joi.string().trim(),
        limit: Joi.number().integer().min(1).min(100),
        page: Joi.number().integer().min(1).max(10),
    }),
};

const getUser = {
    params: Joi.object().keys({
        userId: customValidation.id().required(),
    }),
};

const updateUser = {
    params: Joi.object().keys({
        userId: customValidation.id().required(),
    }),
    body: Joi.object()
        .keys({
            name: customValidation.stringValidator(
                'user',
                UserConstants.USER_NAME_PATTERN,
                3,
                50
            ),
            role: customValidation.id(),
            isActive: customValidation.isActive(),
        })
        .or('email', 'password', 'name', 'role', 'isActive')
        .messages({
            'object.min': 'At least one field must be provided for update.',
        }),
};

const deleteUser = {
    params: Joi.object().keys({
        userId: customValidation.id().required(),
    }),
};

const UserValidation = {
    createUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
};

export default UserValidation;
