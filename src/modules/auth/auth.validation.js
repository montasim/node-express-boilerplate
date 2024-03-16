import Joi from 'joi';

import CustomValidation from '../../validations/custom.validation.js';

const register = {
    body: Joi.object().keys({
        email: Joi.string().email().required().external(CustomValidation.email),
        password: Joi.string().required().external(CustomValidation.password),
        name: Joi.string().required(),
    }),
};

const login = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),
};

const logout = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required(),
    }),
};

const refreshTokens = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required(),
    }),
};

const forgotPassword = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
    }),
};

const resetPassword = {
    query: Joi.object().keys({
        token: Joi.string().required(),
    }),
    body: Joi.object().keys({
        password: Joi.string().required().custom(CustomValidation.password),
    }),
};

const verifyEmail = {
    query: Joi.object().keys({
        token: Joi.string().required(),
    }),
};

const AuthValidation = {
    register,
    login,
    logout,
    refreshTokens,
    forgotPassword,
    resetPassword,
    verifyEmail,
};

export default AuthValidation;
