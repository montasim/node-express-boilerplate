import httpStatus from 'http-status';

import config from '../../config/config.js';

import packageJson from '../../../package.json' assert { type: 'json' };

const indexService = () => {
    return {
        success: true,
        message: '👋 Welcome to the Node Express Boilerplate!',
        data: {
            version: packageJson.version,
            author: packageJson.author.name,
            license: packageJson.license,
            type: packageJson.type,
            main: packageJson.main,
            engines: {
                node: packageJson.engines.node,
                npm: packageJson.engines.npm,
            },
            description: packageJson.description,
            contact: {
                email: config.email.from,
            },
            statusInformation: "✅ All systems are currently operational.",
            termsOfService: "/terms",
            documentation: {
                "apiDocumentation": "/docs./api",
                "codeDocumentation": "/docs./code"
            },
            rateLimit: {
                limit: `🕛 ${config.rateLimit.max} requests per ${config.rateLimit.windowMs} milliseconds.`,
                info: `To ensure fair usage, our API limits the number of requests to ${config.rateLimit.max} every ${config.rateLimit.windowMs} milliseconds.`
            },
            environment: {
                current: config.env,
                apiVersion: config.version
            },
            endpoints: {
                index: "/",
                undefined: "/undefined",
            },
            authentication: {
                info: "Authenticate requests with a token in the header.",
                signupEndpoint: "/api/v1/auth/register"
            },
            tutorials: {
                gettingStarted: "/docs/getting-started"
            },
            healthStatus: {
                checkEndpoint: "/status",
                knownIssues: []
            },
            contactDeveloper: {
                email: packageJson.author.email,
                mobile: packageJson.author.mobile,
                portfolio: packageJson.author.portfolio,
                linkedin: packageJson.author.linkedin,
                github: packageJson.author.github
            }
        },
        status: httpStatus.OK
    };
};

export default indexService;
