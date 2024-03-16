import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config({
    path: `.env.${process.env.NODE_ENV || 'development'}`,
});

// Helper function to parse environment variables to integers with a default value
const getInt = (envVar, defaultValue) => parseInt(envVar, 10) || defaultValue;

// Base MongoDB URL which might be appended with '-test' for test environment
const mongoDbUrl =
    process.env.MONGODB_URL + (process.env.NODE_ENV === 'test' ? '-test' : '');

const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('production', 'staging', 'development', 'test')
        .required()
        .description('The application environment.'),
    VERSION: Joi.string()
        .valid('v1', 'v2', 'v3', 'v4', 'v5')
        .required()
        .description('The API version to use'),
    PORT: Joi.number().required().description('The server port'),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
        .required()
        .description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
        .required()
        .description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
        .required()
        .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
        .required()
        .description('minutes after which verify email token expires'),
    TIMEOUT_IN_SECONDS: Joi.number()
        .required()
        .description('timeout in seconds'),
    CACHE_TTL_IN_MILLISECOND: Joi.number().required().description('cache ttl'),
    JSON_PAYLOAD_LIMIT: Joi.number()
        .required()
        .description('json payload limit'),
    CORS_ORIGIN: Joi.string().required().description('cors origin'),
    CORS_METHODS: Joi.string().required().description('cors methods'),
    SMTP_HOST: Joi.string()
        .required()
        .description('server that will send the emails'),
    SMTP_PORT: Joi.number()
        .required()
        .description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string()
        .required()
        .description('username for email server'),
    SMTP_PASSWORD: Joi.string()
        .required()
        .description('password for email server'),
    EMAIL_FROM: Joi.string()
        .required()
        .description('the from field in the emails sent by the app'),
    GOOGLE_DRIVE_SCOPE: Joi.string()
        .required()
        .description('scope for google drive api'),
    GOOGLE_DRIVE_CLIENT_EMAIL: Joi.string()
        .required()
        .description('client email for google drive api'),
    GOOGLE_DRIVE_PRIVATE_KEY: Joi.string()
        .required()
        .description('private key for google drive api'),
    GOOGLE_DRIVE_FOLDER_KEY: Joi.string()
        .required()
        .description('folder key for google drive api'),
}).unknown();

const { value: envVars, error } = envVarsSchema.validate(process.env, {
    abortEarly: false,
});

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const config = {
    env: envVars.NODE_ENV,
    version: envVars.VERSION,
    port: getInt(process.env.PORT),
    mongoose: {
        url: mongoDbUrl,
        options: {
            useUnifiedTopology: true,
        },
    },
    jwt: {
        secret: envVars.JWT_SECRET,
        accessExpirationMinutes: getInt(envVars.JWT_ACCESS_EXPIRATION_MINUTES),
        refreshExpirationDays: getInt(envVars.JWT_REFRESH_EXPIRATION_DAYS),
        resetPasswordExpirationMinutes: getInt(
            envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES
        ),
        verifyEmailExpirationMinutes: getInt(
            envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES
        ),
    },
    timeout: getInt(envVars.TIMEOUT_IN_SECONDS),
    cache: {
        timeout: getInt(envVars.CACHE_TTL_IN_MILLISECOND),
    },
    jsonPayloadLimit: getInt(envVars.JSON_PAYLOAD_LIMIT),
    cors: {
        origin: envVars.CORS_ORIGIN.split(',').map(origin => origin.trim()),
        methods: envVars.CORS_METHODS.split(',').map(method => method.trim()),
    },
    email: {
        smtp: {
            host: envVars.SMTP_HOST,
            port: getInt(envVars.SMTP_PORT),
            auth: {
                user: envVars.SMTP_USERNAME,
                pass: envVars.SMTP_PASSWORD,
            },
        },
        from: envVars.EMAIL_FROM,
    },
    googleDrive: {
        scope: envVars.GOOGLE_DRIVE_SCOPE,
        client: envVars.GOOGLE_DRIVE_CLIENT_EMAIL,
        privateKey: envVars.GOOGLE_DRIVE_PRIVATE_KEY,
        folderKey: envVars.GOOGLE_DRIVE_FOLDER_KEY,
    },
};

export default config;
