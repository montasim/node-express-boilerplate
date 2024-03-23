const emailStyle = () => {
    return `
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .header {
            color: #d32f2f;
            font-size: 20px;
            text-align: left;
            border-bottom: 2px solid #eeeeee;
            padding-bottom: 10px;
        }
        .content {
            color: #333333;
            font-size: 16px;
            line-height: 1.6;
            padding-top: 20px;
        }
        .button {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            border-radius: 5px;
            font-size: 16px;
            margin-top: 20px;
        }
        .footer {
            font-size: 14px;
            text-align: center;
            margin-top: 20px;
            color: #999999;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
        }
        pre {
            background-color: #e9ecef;
            overflow: auto;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
            line-height: 1.5;
        }
        blockquote {
            margin-left: 0;
            padding-left: 15px;
            border-left: 5px solid #007bff;
            font-style: normal;
            background-color: #e9ecef;
            padding: 10px;
        }
        @media (max-width: 600px) {
            .container {
                padding: 10px;
                border-radius: 0;
            }
        }
    `;
};

const registration = (name, userEmailAddress, verifyEmailToken) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Our Service</title>
            <style>
                ${emailStyle}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">Welcome to Our Service!</div>
                <div class="content">
                    <p>Dear ${name},</p>
                    <p>We are excited to welcome you to our platform. You've taken the first step into a community that values your presence.</p>
                    <p>Your account with the email address <strong>${userEmailAddress}</strong> has been successfully created. We are thrilled to have you on board and look forward to providing you with an exceptional experience.</p>
                    <p>To get started, we invite you to visit our website and explore the wide range of features available to you:</p>
                    <a href='http://localhost:5000/${verifyEmailToken}' target="_blank" rel="noopener noreferrer" class="button">Verify Your Account</a>
                    <p>If you have any questions, do not hesitate to get in touch with our support team. We're here to help!</p>
                    <p>Welcome aboard,</p>
                </div>
                <div class="footer">
                    Warm regards,<br>Your Team at Our Service
                </div>
            </div>
        </body>
        </html>
    `;
};

const successfullLogin = (name, userEmailAddress) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Successful Login Notification</title>
            <style>
                ${emailStyle}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">Successful Login Alert</div>
                <div class="content">
                    <p>Dear ${name},</p>
                    <p>We noticed a new login to your account with the email address <strong>${userEmailAddress}</strong> and wanted to make sure it was you.</p>
                    <p>If this was you, you can safely disregard this message. If you do not recognize this login, please change your password immediately and contact our support team for further assistance.</p>
                    <p>Here are some tips to keep your account secure:</p>
                    <ul>
                        <li>Never share your password with anyone.</li>
                        <li>Use a strong, unique password for your account.</li>
                    </ul>
                    <p>Thank you for being a valued member of our community.</p>
                </div>
                <div class="footer">
                    Warm regards,<br>Your Team at Our Service
                </div>
            </div>
        </body>
        </html>
    `;
};

const failedLoginAttempts = (name, userEmailAddress) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Failed Login Attempt Alert</title>
            <style>
                ${emailStyle}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">Alert: Failed Login Attempts Detected</div>
                <div class="content">
                    <p>Dear ${name},</p>
                    <p>We have detected multiple failed login attempts to your account with the email address <strong>${userEmailAddress}</strong>. This could be a sign that someone else is trying to access your account.</p>
                    <p>If you were not trying to log in, please take the following actions immediately to secure your account:</p>
                    <ul>
                        <li>Change your password to something strong and unique. Avoid using common phrases or sequences.</li>
                        <li>Review your account for any unauthorized changes or activity.</li>
                        <li>Contact our support team if you need any assistance or if you notice anything out of the ordinary.</li>
                    </ul>
                    <p>To change your password or review your account security settings, please log in to your account and navigate to the security settings page.</p>
                    <a href="https://example.com/login" target="_blank" rel="noopener noreferrer" class="button">Log In</a>
                    <p>Keeping your account secure is a top priority for us. Thank you for your immediate attention to this matter.</p>
                </div>
                <div class="footer">
                    Warm regards,<br>Your Team at Our Service
                </div>
            </div>
        </body>
        </html>
    `;
};

const maxActiveSessionsAlert = (name, userEmailAddress) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Maximum Active Sessions Alert</title>
            <style>
                ${emailStyle}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">Maximum Active Sessions Reached</div>
                <div class="content">
                    <p>Dear ${name},</p>
                    <p>Your account with the email address <strong>${userEmailAddress}</strong> has reached the maximum number of active sessions allowed. This might occur if you've logged in from many devices or if someone else is using your account.</p>
                    <p>If you believe this is an error, or if you did not initiate these sessions, we strongly recommend taking the following actions to secure your account:</p>
                    <ul>
                        <li>Log out of all other sessions except the one you're currently using. You can do this from your account settings page.</li>
                        <li>Change your password to something strong and unique. Avoid using common phrases or sequences.</li>
                        <li>Enable two-factor authentication (2FA) for an added layer of security on your account.</li>
                        <li>Contact our support team if you need assistance or if you notice any unusual activity.</li>
                    </ul>
                    <p>To manage your active sessions or to update your security settings, please log in to your account:</p>
                    <a href="https://example.com/login" target="_blank" rel="noopener noreferrer" class="button">Log In</a>
                    <p>We appreciate your attention to keeping your account secure. Thank you for being a valued member of our community.</p>
                </div>
                <div class="footer">
                    Warm regards,<br>Your Team at Our Service
                </div>
            </div>
        </body>
        </html>
    `;
};

const passwordResetSuccess = (name, userEmailAddress) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Successful</title>
            <style>
                ${emailStyle}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">Password Reset Successful</div>
                <div class="content">
                    <p>Dear ${name},</p>
                    <p>This is a confirmation that the password for your account with the email address <strong>${userEmailAddress}</strong> has been successfully changed.</p>
                    <p>If you did not request this change, it is important that you <strong>contact our support team immediately</strong> to ensure the security of your account. Your account's safety is our top priority.</p>
                    <p>Here are some additional security tips:</p>
                    <ul>
                        <li>Regularly update your password and choose a strong, unique password.</li>
                        <li>Be cautious of phishing emails and websites asking for your personal information.</li>
                        <li>Enable two-factor authentication (2FA) for an added layer of security on your account.</li>
                    </ul>
                    <p>For any further assistance, do not hesitate to get in touch with our support team.</p>
                    <a href="https://example.com/login" target="_blank" rel="noopener noreferrer" class="button">Log In</a>
                    <p>Thank you for ensuring the security of your account.</p>
                </div>
                <div class="footer">
                    Warm regards,<br>Your Team at Our Service
                </div>
            </div>
        </body>
        </html>
    `;
};

const emailVerificationSuccess = (name, userEmailAddress) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification Successful</title>
            <style>
                ${emailStyle}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">Email Verification Complete</div>
                <div class="content">
                    <p>Dear ${name},</p>
                    <p>Congratulations! The email address <strong>${userEmailAddress}</strong> has been successfully verified. Your account is now fully activated, and you're all set to enjoy the features of our service.</p>
                    <p>Getting started:</p>
                    <ul>
                        <li>Explore our website to discover the various services and features available to you.</li>
                        <li>Customize your profile to make the most out of your experience with us.</li>
                        <li>Should you have any questions or require assistance, our support team is here to help you.</li>
                    </ul>
                    <p>You can now log in to your account using the link below:</p>
                    <a href="https://example.com/login" target="_blank" rel="noopener noreferrer" class="button">Log In</a>
                    <p>We're excited to have you with us and look forward to supporting you.</p>
                </div>
                <div class="footer">
                    Warm regards,<br>Your Team at Our Service
                </div>
            </div>
        </body>
        </html>
    `;
};

const error = error => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API Error Notification</title>
            <style>
                ${emailStyle}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">API Error Notification</div>
                <div class="content">
                    <p>Dear Admin,</p>
                    <p>An uncaught exception occurred within our system, triggering this automated notification. Below are the details of the error encountered:</p>
                    <h4>Error Details:</h4>
                    <blockquote>Error Message: ${error?.message || 'Error message not available'}</blockquote>
                    <p>Error Stack:</p>
                    <pre>${error?.stack || 'Stack trace not available'}</pre>
                    <p>Please use the link below to report this issue, providing any additional information that might help in diagnosing and resolving the problem:</p>
                    <a href="https://github.com/montasim/node-express-boilerplate/issues" target="_blank" rel="noopener noreferrer" class="button">Report Issue on GitHub</a>
                    <p>Thank you for your immediate attention to this matter.</p>
                </div>
                <div class="footer">
                    Warm regards,<br>Your IT Team
                </div>
            </div>
        </body>
        </html>
    `;
};

const EmailTemplate = {
    registration,
    successfullLogin,
    failedLoginAttempts,
    maxActiveSessionsAlert,
    passwordResetSuccess,
    emailVerificationSuccess,
    error,
};

export default EmailTemplate;
