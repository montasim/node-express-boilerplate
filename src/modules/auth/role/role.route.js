import express from 'express';

import authMiddleware from '../../../middleware/auth.middleware.js';
import validateRequestMiddleware from '../../../middleware/validateRequest.middleware.js';

import RoleValidation from './role.validation.js';
import RoleController from './role.controller.js';
import CacheMiddleware from '../../../middleware/cache.middleware.js';
import config from '../../../config/config.js';

const router = express.Router();

router
    .route('/')
    .post(
        authMiddleware(['role-create']),
        CacheMiddleware.invalidate('role'),
        validateRequestMiddleware(RoleValidation.createRole),
        RoleController.createRole
    )
    .get(
        authMiddleware(['role-view']),
        CacheMiddleware.create(config.cache.timeout),
        validateRequestMiddleware(RoleValidation.getRoles),
        RoleController.getRoles
    );

router
    .route('/:roleId')
    .get(
        authMiddleware(['role-view']),
        CacheMiddleware.create(config.cache.timeout),
        validateRequestMiddleware(RoleValidation.getRole),
        RoleController.getRole
    )
    .put(
        authMiddleware(['role-modify']),
        CacheMiddleware.invalidate('role'),
        validateRequestMiddleware(RoleValidation.updateRole),
        RoleController.updateRole
    )
    .delete(
        authMiddleware(['role-modify']),
        CacheMiddleware.invalidate('role'),
        validateRequestMiddleware(RoleValidation.deleteRole),
        RoleController.deleteRole
    );

export default router;
