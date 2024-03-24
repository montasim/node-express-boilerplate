import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import swaggerDefinition from '../../docs/api/swaggerDef.js';

const router = express.Router();

// Get the directory name of the current module file
const currentDirname = dirname(fileURLToPath(import.meta.url));

const specs = swaggerJsdoc({
    swaggerDefinition,
    apis: [
        join(currentDirname, '../../docs/*.yml'),
        join(currentDirname, './v1/*.js')
    ],
});

router.use('/api', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

router.use('/code', express.static(join(currentDirname, '../../docs/code')));

export default router;
