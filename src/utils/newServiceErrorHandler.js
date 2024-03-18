import httpStatus from 'http-status';

const newServiceErrorHandler = error => {
    return {
        success: false,
        statusCode: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
        message:
            error.message ||
            'Internal server error on PermissionService.deletePermission()',
        data: error.data || null, // Include error data if available
    };
};

export default newServiceErrorHandler;
