import formatTimestampWithTimeZone from './formatTimestampWithTimeZone.js';
import calculateRequestProcessTime from './calculateRequestProcessTime.js';

const generateRequestResponseMetadata = (
    startTime,
    device,
    ifNoneMatch,
    ifModifiedSince
) => {
    const endTime = Date.now();

    return {
        requestTime: formatTimestampWithTimeZone(startTime),
        responseTime: formatTimestampWithTimeZone(endTime),
        processTime: calculateRequestProcessTime(endTime, startTime),
        device: device,
        cache: ifNoneMatch || ifModifiedSince ? 'Cache' : 'No-Cache',
    };
};

export default generateRequestResponseMetadata;
