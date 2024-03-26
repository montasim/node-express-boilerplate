import express from 'express';

import validateRequestMiddleware from '../../../middleware/validateRequest.middleware.js';

import PermissionValidation from './permission.validation.js';
import PermissionController from './permission.controller.js';
import CacheMiddleware from '../../../middleware/cache.middleware.js';

import authMiddleware from '../../../middleware/auth.middleware.js';

const router = express.Router();

router
    .route('/')
    .post(
        CacheMiddleware.invalidate('permission'),
        // TODO: Implement easy way to add multiple permissions
        authMiddleware(['permission-create']),
        validateRequestMiddleware(PermissionValidation.createPermission),
        PermissionController.createPermission
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
        CacheMiddleware.invalidate('permission'),
        authMiddleware(['permission-modify']),
        validateRequestMiddleware(PermissionValidation.updatePermission),
        PermissionController.updatePermission
    )
    .delete(
        CacheMiddleware.invalidate('permission'),
        authMiddleware(['permission-modify']),
        validateRequestMiddleware(PermissionValidation.deletePermission),
        PermissionController.deletePermission
    );

export default router;
