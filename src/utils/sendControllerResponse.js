import fetchRequestMetadata from './fetchRequestMetadata.js';
import generateRequestResponseMetadata from './generateRequestResponseMetadata.js';
import prepareResponseData from './prepareResponseData.js';
import controllerErrorHandler from './handleControllerError.js';

const sendControllerResponse = async (
    req,
    res,
    requestStartTime,
    operation,
    operationArgs,
    actionDescription
) => {
    const { device, links, meta, ifNoneMatch, ifModifiedSince } =
        await fetchRequestMetadata(req);

    try {
        const { serviceSuccess, serviceData, serviceMessage, serviceStatus } =
            await operation(...operationArgs);

        const responseMetaData = generateRequestResponseMetadata(
            requestStartTime,
            device,
            ifNoneMatch,
            ifModifiedSince
        );
        const responseData = prepareResponseData(
            serviceSuccess,
            serviceData,
            serviceMessage,
            serviceStatus,
            links,
            { ...meta, ...responseMetaData }
        );

        return res.status(responseData?.status).json(responseData);
    } catch (error) {
        return controllerErrorHandler(
            res,
            error,
            requestStartTime,
            device,
            links,
            meta,
            ifNoneMatch,
            ifModifiedSince,
            actionDescription
        );
    }
};

export default sendControllerResponse;
