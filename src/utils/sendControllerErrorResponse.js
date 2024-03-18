import httpStatus from 'http-status';

const sendControllerErrorResponse = (res, error, errorControllerName) => {
    const errorResponse = {
        success: false,
        statusCode: error?.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
        message:
            error?.message || `Internal server error on ${errorControllerName}`,
        data: error?.data || null, // Include error data if available
    };

    res.status(errorResponse.statusCode).json(errorResponse);
};

export default sendControllerErrorResponse;
