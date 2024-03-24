import Joi from 'joi';

import CustomValidation from '../../validations/custom.validation.js';
import customValidation from '../../validations/custom.validation.js';
import constants from '../../constants/constants.js';

const createUser = {
    body: Joi.object().keys({
        email: Joi.string()
            .trim()
            .email()
            .required()
            .external(CustomValidation.email),
        password: Joi.string().required().external(CustomValidation.password),
        name: customValidation
            .stringValidator('user', constants.userNamePattern, 3, 50)
            .required(),
        role: customValidation.id(constants.roleNamePattern),
    }),
};

const getUsers = {
    query: Joi.object().keys({
        name: Joi.string().trim(),
        role: customValidation.id(constants.roleNamePattern),
        sortBy: Joi.string().trim(),
        limit: Joi.number().integer().min(1).min(100),
        page: Joi.number().integer().min(1).max(10),
    }),
};

const getUser = {
    params: Joi.object().keys({
        userId: customValidation.id(constants.userNamePattern).required(),
    }),
};

const updateUser = {
    params: Joi.object().keys({
        userId: customValidation.id(constants.userNamePattern).required(),
    }),
    body: Joi.object()
        .keys({
            name: customValidation.stringValidator(
                'user',
                constants.userNamePattern,
                3,
                50
            ),
            role: customValidation.id(constants.roleNamePattern),
            isActive: customValidation.isActive(),
        })
        .or('email', 'password', 'name', 'role', 'isActive')
        .messages({
            'object.min': 'At least one field must be provided for update.',
        }),
};

const deleteUser = {
    params: Joi.object().keys({
        userId: customValidation.id(constants.userNamePattern).required(),
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
