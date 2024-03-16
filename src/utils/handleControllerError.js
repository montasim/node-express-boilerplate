import httpStatus from 'http-status';

import prepareResponseData from './prepareResponseData.js';
import generateRequestResponseMetadata
    from './generateRequestResponseMetadata.js';

const controllerErrorHandler = (res, error, requestStartTime, device, links, meta, ifNoneMatch, ifModifiedSince, errorControllerName) => {
    const errorResponseData = prepareResponseData(
        false,
        {},
        error.message,
        httpStatus.INTERNAL_SERVER_ERROR,
        links,
        generateRequestResponseMetadata(requestStartTime, device, ifNoneMatch, ifModifiedSince)
    );

    return res.status(errorResponseData?.status).json(errorResponseData);
};

export default controllerErrorHandler;
