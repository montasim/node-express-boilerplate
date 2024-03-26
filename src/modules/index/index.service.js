import httpStatus from 'http-status';

import config from '../../config/config.js';

const indexService = () => {
    return {
        success: true,
        message: '👋 Welcome to the Node Express Boilerplate!',
        data: {
            version: '1.0.0',
            author: 'Mohammad Montasim -Al- Mamun Shuvo',
            license: 'MIT',
            type: 'module',
            main: 'src/server.js',
            engines: {
                node: '>=18.x',
                npm: '>=10.2.3',
            },
            description:
                'Create a Node.js app for building production-ready RESTful APIs using Express, by running one command',
            contact: {
                email: config.email.from,
            },
            statusInformation: '✅ All systems are currently operational.',
            termsOfService: '/terms',
            documentation: {
                apiDocumentation: '/docs./api',
                codeDocumentation: '/docs./code',
            },
            rateLimit: {
                limit: `🕛 ${config.rateLimit.max} requests per ${config.rateLimit.windowMs} milliseconds.`,
                info: `To ensure fair usage, our API limits the number of requests to ${config.rateLimit.max} every ${config.rateLimit.windowMs} milliseconds.`,
            },
            environment: {
                current: config.env,
                apiVersion: config.version,
            },
            endpoints: {
                index: '/',
                undefined: '/undefined',
            },
            authentication: {
                info: 'Authenticate requests with a token in the header.',
                signupEndpoint: '/api/v1/auth/register',
            },
            tutorials: {
                gettingStarted: '/docs/getting-started',
            },
            healthStatus: {
                checkEndpoint: '/status',
                knownIssues: [],
            },
            contactDeveloper: {
                email: 'montasimmamun@gmail.com',
                mobile: '+8801722815469',
                portfolio: 'https://montasim-dev.web.app/',
                linkedin: 'https://www.linkedin.com/in/montasim',
                github: 'https://github.com/montasim',
            },
        },
        status: httpStatus.OK,
    };
};

export default indexService;
