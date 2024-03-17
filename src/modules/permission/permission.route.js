import express from 'express';

import validateRequest from '../../middlewares/validateRequest.js';

import PermissionValidation from './permission.validation.js';
import PermissionController from './permission.controller.js';

const router = express.Router();

router
    .route('/')
    .post(
        validateRequest(PermissionValidation.createPermission),
        PermissionController.createPermission
    )
    .get(
        validateRequest(PermissionValidation.getPermissions),
        PermissionController.getPermissions
    );

router
    .route('/:permissionId')
    .get(
        validateRequest(PermissionValidation.getPermission),
        PermissionController.getPermission
    )
    .put(
        validateRequest(PermissionValidation.updatePermission),
        PermissionController.updatePermission
    )
    .delete(
        validateRequest(PermissionValidation.deletePermission),
        PermissionController.deletePermission
    );

export default router;
