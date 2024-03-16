import httpStatus from 'http-status';

const undefinedService = () => {
    return {
        data: {},
        message: '🚧 Invalid route! Please check the URL and try again.',
        status: httpStatus.NOT_FOUND,
    };
};

export default undefinedService;
