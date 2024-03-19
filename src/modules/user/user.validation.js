import Joi from 'joi';

import CustomValidation from '../../validations/custom.validation.js';
import customValidation from '../../validations/custom.validation.js';

const createUser = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required().custom(CustomValidation.password),
        name: Joi.string().required(),
        role: Joi.string().required().valid('user', 'admin'),
    }),
};

const getUsers = {
    query: Joi.object().keys({
        name: Joi.string(),
        role: Joi.string(),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
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
            email: Joi.string().email(),
            password: Joi.string().custom(CustomValidation.password),
            name: Joi.string(),
        })
        .min(1),
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
