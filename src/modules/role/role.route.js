import express from 'express';

import authMiddleware from '../../middleware/auth.middleware.js';
import validateRequestMiddleware from '../../middleware/validateRequest.middleware.js';

import RoleValidation from './role.validation.js';
import RoleController from './role.controller.js';

const router = express.Router();

// TODO: Add permission population when fetching roles
// TODO: Add permission population when fetching a role
// TODO: Individually add or remove permissions from a role

router
    .route('/')
    .post(validateRequestMiddleware(RoleValidation.createRole), RoleController.createRole)
    .get(validateRequestMiddleware(RoleValidation.getRoles), RoleController.getRoles);

router
    .route('/:roleId')
    .get(validateRequestMiddleware(RoleValidation.getRole), RoleController.getRole)
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
