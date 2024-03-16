import formatTimestampWithTimeZone from './formatTimestampWithTimeZone.js';

const prepareResponseData = (success, data, message, status, links, meta) => {
    try {
        const timestamp = formatTimestampWithTimeZone(Date.now());

        return {
            success,
            status,
            timestamp,
            message,
            data,
            links,
            meta,
        };
    } catch (error) {
        throw new Error(`Failed to prepare response data: ${error.message}`);
    }
};

export default prepareResponseData;
