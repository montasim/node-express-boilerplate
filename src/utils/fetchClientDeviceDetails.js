import httpStatus from 'http-status';
import expressUseragent from 'express-useragent';
import requestIp from 'request-ip';

import ServerError from './serverError.js';

const fetchClientDeviceDetails = async req => {
    try {
        const source = req.headers['user-agent']; // Get the User-Agent header
        const userAgent = expressUseragent.parse(source); // Parse the User-Agent string
        const os = userAgent.os; // Get the OS details
        const browser = userAgent.browser; // Get the browser details
        const version = userAgent.version; // Get the browser version
        const ip = requestIp.getClientIp(req); // Get the client's IP address
        const languageHeader = req.headers['accept-language']; // Get the Accept-Language header
        const language = languageHeader
            ? languageHeader.split(',')[0]
            : undefined;
        const device = userAgent.isDesktop
            ? 'Desktop'
            : userAgent.isTablet
                ? 'Tablet'
                : userAgent.isMobile
                    ? 'Mobile'
                    : 'Unknown';

        return {
            language,
            os,
            ip,
            device,
            browser,
            version,
        };
    } catch (error) {
        throw new ServerError(
            httpStatus.INTERNAL_SERVER_ERROR,
            `Failed to extract device details in getRequestedDeviceDetails(): ${error.message}`,
            true,
            error.stack
        );
    }
};

export default fetchClientDeviceDetails;
