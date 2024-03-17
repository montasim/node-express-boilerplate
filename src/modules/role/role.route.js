import express from 'express';

import validateRequest from '../../middlewares/validateRequest.js';

// import RoleValidation from './role.validation.js';
import RoleController from './role.controller.js';

const router = express.Router();

router
    .route('/')
    .post(
        // validateRequest(RoleValidation.createRole),
        RoleController.createRole
    );

export default router;
