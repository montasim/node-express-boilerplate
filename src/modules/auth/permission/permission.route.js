import express from 'express';

import validateRequestMiddleware from '../../../middleware/validateRequest.middleware.js';

import PermissionValidation from './permission.validation.js';
import PermissionController from './permission.controller.js';
import CacheMiddleware from '../../../middleware/cache.middleware.js';

import authMiddleware from '../../../middleware/auth.middleware.js';

const router = express.Router();

// Middleware for cache invalidation after create, update, or delete
const invalidatePermissionsCache = (req, res, next) => {
    CacheMiddleware.invalidate('.*permission.*');

    next();
};

router
    .route('/')
    .post(
        authMiddleware(['permission-create']),
        validateRequestMiddleware(PermissionValidation.createPermission),
        PermissionController.createPermission,
        invalidatePermissionsCache
    )
    .get(
        authMiddleware(['permission-view']),
        CacheMiddleware.create(3600),
        validateRequestMiddleware(PermissionValidation.getPermissions),
        PermissionController.getPermissions
    );

router
    .route('/:permissionId')
    .get(
        authMiddleware(['permission-view']),
        CacheMiddleware.create(3600),
        validateRequestMiddleware(PermissionValidation.getPermission),
        PermissionController.getPermission
    )
    .put(
        authMiddleware(['permission-modify']),
        validateRequestMiddleware(PermissionValidation.updatePermission),
        PermissionController.updatePermission,
        invalidatePermissionsCache
    )
    .delete(
        authMiddleware(['permission-modify']),
        validateRequestMiddleware(PermissionValidation.deletePermission),
        PermissionController.deletePermission,
        invalidatePermissionsCache
    );

export default router;
