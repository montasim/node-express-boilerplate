import express from 'express';

import auth from '../../middlewares/auth.js';
import validateRequest from '../../middlewares/validateRequest.js';

import RoleValidation from './role.validation.js';
import RoleController from './role.controller.js';

const router = express.Router();

// TODO: Add permission population when fetching roles
// TODO: Add permission population when fetching a role
// TODO: Individually add or remove permissions from a role

router
    .route('/')
    .post(validateRequest(RoleValidation.createRole), RoleController.createRole)
    .get(validateRequest(RoleValidation.getRoles), RoleController.getRoles);

router
    .route('/:roleId')
    .get(validateRequest(RoleValidation.getRole), RoleController.getRole)
    .put(
        auth('role-modify'),
        validateRequest(RoleValidation.updateRole),
        RoleController.updateRole
    )
    .delete(
        auth('role-modify'),
        validateRequest(RoleValidation.deleteRole),
        RoleController.deleteRole
    );

export default router;
