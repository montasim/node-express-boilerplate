const errorEmailBody = (error) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API Error Notification</title>
            <style>
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

export default errorEmailBody;
