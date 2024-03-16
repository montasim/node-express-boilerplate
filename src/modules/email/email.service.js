import nodemailer from 'nodemailer';

import errorEmailBody from '../../utils/errorEmailBody.js';

import config from '../../config/config.js';
import logger from '../../config/logger.js';

const transport = nodemailer.createTransport(config.email.smtp);

/* istanbul ignore next */
if (config.env !== 'test') {
    transport
        .verify()
        .then(() => logger.info('Connected to email server'))
        .catch(() =>
            logger.warn(
                'Unable to connect to email server. Make sure you have configured the SMTP options in .env'
            )
        );
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @returns {Promise}
 */
const sendEmail = async (to, subject, html) => {
    const message = {
        from: config.email.from,
        to: to | config.admin.email,
        subject,
        html
    };

    await transport.sendMail(message);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
    const subject = 'Reset password';
    // replace this url with the link to the reset password page of your front-end app
    const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
    const html = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;

    await sendEmail(to, subject, html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
    const subject = 'Email Verification';
    // replace this url with the link to the email verification page of your front-end app
    const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
    const html = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;

    await sendEmail(to, subject, html);
};

/**
 * Send an email for uncaught exceptions
 * @param {Error} error - The uncaught exception error
 */
const sendUncaughtExceptionEmail = async (error) => {
    const subject = 'Node Express Boilerplate: Uncaught Exception Error';
    const html = errorEmailBody(error);

    await sendEmail(config.admin.email, subject, html);
};

/**
 * Send an email for unhandled rejections
 * @param {Error} reason - The unhandled rejection reason
 * @param {Promise} promise - The unhandled promise
 */
const sendUnhandledRejectionEmail = async (reason, promise) => {
    const subject = 'Node Express Boilerplate: Unhandled Rejection Error';
    const html = errorEmailBody(reason);

    await sendEmail(config.admin.email, subject, html);
};

const EmailService = {
    transport,
    sendEmail,
    sendResetPasswordEmail,
    sendVerificationEmail,
    sendUncaughtExceptionEmail,
    sendUnhandledRejectionEmail
};

export default EmailService;
