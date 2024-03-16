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
        .valid('production', 'development', 'test')
        .required(),
    PORT: Joi.number().description('The server port').required(),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
        .default(30)
        .description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
        .default(30)
        .description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
        .default(10)
        .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
        .default(10)
        .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description(
        'the from field in the emails sent by the app'
    ),
}).unknown();

const { value: envVars, error } = envVarsSchema.validate(process.env, {
    abortEarly: false,
});

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const config = {
    env: envVars.NODE_ENV,
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
};

export default config;
