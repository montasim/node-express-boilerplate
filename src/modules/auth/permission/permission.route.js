import express from 'express';

import validateRequestMiddleware from '../../../middleware/validateRequest.middleware.js';

import PermissionValidation from './permission.validation.js';
import PermissionController from './permission.controller.js';

const router = express.Router();

router
    .route('/')
    .post(
        validateRequestMiddleware(PermissionValidation.createPermission),
        PermissionController.createPermission
    )
    .get(
        validateRequestMiddleware(PermissionValidation.getPermissions),
        PermissionController.getPermissions
    );

router
    .route('/:permissionId')
    .get(
        validateRequestMiddleware(PermissionValidation.getPermission),
        PermissionController.getPermission
    )
    .put(
        validateRequestMiddleware(PermissionValidation.updatePermission),
        PermissionController.updatePermission
    )
    .delete(
        validateRequestMiddleware(PermissionValidation.deletePermission),
        PermissionController.deletePermission
    );

export default router;
