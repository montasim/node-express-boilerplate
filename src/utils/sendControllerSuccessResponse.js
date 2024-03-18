const sendControllerSuccessResponse = (res, successData) => {
    const errorResponse = {
        success: successData?.success,
        statusCode: successData?.statusCode,
        message: successData?.message,
        data: successData?.data,
    };

    res.status(errorResponse.statusCode).json(errorResponse);
};

export default sendControllerSuccessResponse;
