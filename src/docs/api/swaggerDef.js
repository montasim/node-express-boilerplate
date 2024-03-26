import config from '../../config/config.js';

const swaggerDef = {
    openapi: '3.0.0',
    info: {
        title: 'node-express-boilerplate API documentation',
        version: '1.0.0',
        license: {
            name: 'MIT',
            url: 'https://github.com/montasim/node-express-boilerplate/blob/master/LICENSE',
        },
    },
    servers: [
        {
            url: `http://localhost:${config.port}/${config.version}`,
        },
    ],
};

export default swaggerDef;
