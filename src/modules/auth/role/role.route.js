import express from 'express';

import authMiddleware from '../../../middleware/auth.middleware.js';
import validateRequestMiddleware from '../../../middleware/validateRequest.middleware.js';

import RoleValidation from './role.validation.js';
import RoleController from './role.controller.js';

const router = express.Router();

router
    .route('/')
    .post(
        authMiddleware('role-create'),
        validateRequestMiddleware(RoleValidation.createRole),
        RoleController.createRole
    )
    .get(
        authMiddleware('role-view'),
        validateRequestMiddleware(RoleValidation.getRoles),
        RoleController.getRoles
    );

router
    .route('/:roleId')
    .get(
        authMiddleware('role-view'),
        validateRequestMiddleware(RoleValidation.getRole),
        RoleController.getRole
    )
    .put(
        authMiddleware('role-modify'),
        validateRequestMiddleware(RoleValidation.updateRole),
        RoleController.updateRole
    )
    .delete(
        authMiddleware('role-modify'),
        validateRequestMiddleware(RoleValidation.deleteRole),
        RoleController.deleteRole
    );

export default router;
