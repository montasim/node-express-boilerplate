import express from 'express';

import authMiddleware from '../../../middleware/auth.middleware.js';
import validateRequestMiddleware from '../../../middleware/validateRequest.middleware.js';

import PermissionValidation from './permission.validation.js';
import PermissionController from './permission.controller.js';
import CacheMiddleware from '../../../middleware/cache.middleware.js';
import config from '../../../config/config.js';

const router = express.Router();

router
    .route('/')
    .post(
        // TODO: Implement easy way to add multiple permissions
        authMiddleware(['permission-create']),
        CacheMiddleware.invalidate('permission'),
        validateRequestMiddleware(PermissionValidation.createPermission),
        PermissionController.createPermission
    )
    .get(
        authMiddleware(['permission-view']),
        CacheMiddleware.create(config.cache.timeout),
        validateRequestMiddleware(PermissionValidation.getPermissions),
        PermissionController.getPermissions
    );

router
    .route('/:permissionId')
    .get(
        authMiddleware(['permission-view']),
        CacheMiddleware.create(config.cache.timeout),
        validateRequestMiddleware(PermissionValidation.getPermission),
        PermissionController.getPermission
    )
    .put(
        authMiddleware(['permission-modify']),
        CacheMiddleware.invalidate('permission'),
        validateRequestMiddleware(PermissionValidation.updatePermission),
        PermissionController.updatePermission
    )
    .delete(
        authMiddleware(['permission-modify']),
        CacheMiddleware.invalidate('permission'),
        validateRequestMiddleware(PermissionValidation.deletePermission),
        PermissionController.deletePermission
    );

export default router;
