import packageJson from '../../package.json' assert { type: 'json' };
import config from '../config/config.js';

console.log(config);

const swaggerDef = {
    openapi: '3.0.0',
    info: {
        title: 'node-express-boilerplate API documentation',
        version: packageJson.version, // Access the version property from the imported packageJson object
        license: {
            name: 'MIT',
            url: 'https://github.com/hagopj13/node-express-boilerplate/blob/master/LICENSE',
        },
    },
    servers: [
        {
            url: `http://localhost:${config.port}/v1`,
        },
    ],
};

export default swaggerDef;
