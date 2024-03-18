const sendServiceResponse = serviceResponse => {
    return {
        success: true,
        statusCode: serviceResponse.statusCode,
        message: serviceResponse.message,
        data: serviceResponse.data,
    };
};

export default sendServiceResponse;
