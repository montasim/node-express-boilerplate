const asyncErrorHandler = fn => async (req, res, next) => {
    try {
        // Await the execution of the passed-in function
        await fn(req, res, next);
    } catch (error) {
        // In case of an error, pass it to the next error handling middleware
        next(error);
    }
};

export default asyncErrorHandler;
