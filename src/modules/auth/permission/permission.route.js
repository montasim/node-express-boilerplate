import express from 'express';

import validateRequestMiddleware from '../../../middleware/validateRequest.middleware.js';

import PermissionValidation from './permission.validation.js';
import PermissionController from './permission.controller.js';
import authMiddleware from '../../../middleware/auth.middleware.js';

const router = express.Router();

router
    .route('/')
    .post(
        authMiddleware(['permission-create']),
        validateRequestMiddleware(PermissionValidation.createPermission),
        PermissionController.createPermission
    )
    .get(
        authMiddleware(['permission-view']),
        validateRequestMiddleware(PermissionValidation.getPermissions),
        PermissionController.getPermissions
    );

router
    .route('/:permissionId')
    .get(
        authMiddleware(['permission-view']),
        validateRequestMiddleware(PermissionValidation.getPermission),
        PermissionController.getPermission
    )
    .put(
        authMiddleware(['permission-modify']),
        validateRequestMiddleware(PermissionValidation.updatePermission),
        PermissionController.updatePermission
    )
    .delete(
        authMiddleware(['permission-modify']),
        validateRequestMiddleware(PermissionValidation.deletePermission),
        PermissionController.deletePermission
    );

export default router;
