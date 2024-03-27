import nodemailer from 'nodemailer';

import config from '../../config/config.js';
import logger from '../../config/logger.config.js';
import EmailTemplate from './email.template.js';

const transporter = nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: false, // Use TLS. When false, connection will use upgraded TLS (if available) via STARTTLS command.
    auth: {
        user: config.email.smtp.auth.user, // Email sender's address
        pass: config.email.smtp.auth.pass, // Email sender's password
    },
});

/* istanbul ignore next */
if (config.env !== 'test') {
    (async () => {
        try {
            await transporter.verify();

            logger.info('✉️ Connected to email server');
        } catch (error) {
            logger.warn(
                'Unable to connect to email server. Make sure you have configured the SMTP options in .env'
            );
        }
    })();
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @param retryCount
 * @param retryDelay
 * @returns {Promise}
 */
const sendEmail = async (
    to,
    subject,
    html,
    retryCount = 3,
    retryDelay = 5000
) => {
    let attempts = 0;
    const message = {
        from: config.email.from,
        to: to || config.admin.email,
        subject,
        html,
    };

    const send = async () => {
        try {
            await transporter.sendMail(message);

            logger.info('✉️ Email sent successfully');
        } catch (error) {
            attempts++;

            logger.error(
                `Attempt ${attempts}: Failed to send email. Error: ${error.message}`
            );

            if (attempts < retryCount) {
                logger.info(
                    `Retrying to send email in ${retryDelay / 1000} seconds...`
                );

                await new Promise(resolve => setTimeout(resolve, retryDelay));
                await send(); // Retry sending the email
            } else {
                logger.error('All attempts to send email have failed.');
            }
        }
    };

    await send();
};

const sendRegistrationEmail = async (name, email, verifyEmailToken) => {
    const subject = 'Welcome to Our Service!';
    const html = EmailTemplate.registration(name, email, verifyEmailToken);

    await sendEmail(email, subject, html);
};

const sendSuccessfullLoginEmail = async (name, email) => {
    const subject = 'Successful Login Notification';
    const html = EmailTemplate.successfullLogin(name, email);

    await sendEmail(email, subject, html);
};

const sendFailedLoginAttemptsEmail = async (name, email) => {
    const subject = 'Failed Login Attempt Alert';
    const html = EmailTemplate.failedLoginAttempts(name, email);

    await sendEmail(email, subject, html);
};

const sendMaximumActiveSessionEmail = async (name, email) => {
    const subject = 'Maximum Active Sessions Alert';
    const html = EmailTemplate.maxActiveSessionsAlert(name, email);

    await sendEmail(email, subject, html);
};

const sendPasswordResetSuccessEmail = async (name, email) => {
    const subject = 'Password Reset Successful';
    const html = EmailTemplate.passwordResetSuccess(name, email);

    await sendEmail(email, subject, html);
};

const sendEmailVerificationSuccessEmail = async (name, email) => {
    const subject = 'Email Verification Successful';
    const html = EmailTemplate.emailVerificationSuccess(name, email);

    await sendEmail(email, subject, html);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
    const subject = 'Reset Your Password';
    // Replace this URL with the link to the reset password page of your front-end app
    const resetPasswordUrl = `${config.cors.origin}/reset-password?token=${token}`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                    padding: 20px;
                }
                .container {
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 5px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    max-width: 600px;
                    margin: 40px auto;
                }
                .button {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #007BFF;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Reset Your Password</h2>
                <p>Dear user,</p>
                <p>To reset your password, please click on the button below:</p>
                <a href="${resetPasswordUrl}" class="button">Reset Password</a>
                <p>If you did not request a password reset, please ignore this email.</p>
            </div>
        </body>
        </html>
    `;

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
const sendUncaughtExceptionEmail = async error => {
    const subject = 'Node Express Boilerplate: Uncaught Exception Error';
    const html = EmailTemplate.error(error);

    await sendEmail(config.admin.email, subject, html);
};

/**
 * Send an email for unhandled rejections
 * @param {Error} error - The unhandled rejection reason
 */
const sendUnhandledRejectionEmail = async error => {
    const subject = 'Node Express Boilerplate: Unhandled Rejection Error';
    const html = EmailTemplate.error(error);

    await sendEmail(config.admin.email, subject, html);
};

const sendAccountLockedEmail = async (name, email) => {
    const subject = 'Account Locked Notification';
    const html = EmailTemplate.accountLockedEmail(name, email);

    await sendEmail(email, subject, html);
};

const EmailService = {
    sendEmail,
    sendRegistrationEmail,
    sendSuccessfullLoginEmail,
    sendFailedLoginAttemptsEmail,
    sendMaximumActiveSessionEmail,
    sendResetPasswordEmail,
    sendPasswordResetSuccessEmail,
    sendVerificationEmail,
    sendEmailVerificationSuccessEmail,
    sendUncaughtExceptionEmail,
    sendUnhandledRejectionEmail,
    sendAccountLockedEmail,
};

export default EmailService;
