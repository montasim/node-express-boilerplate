import Joi from 'joi';
import httpStatus from 'http-status';

import pick from '../utils/pick.js';
import ServerError from '../utils/serverError.js';

const validate = (schema) => async (req, res, next) => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req, Object.keys(validSchema));

    try {
        // Use validateAsync for asynchronous validation
        const value = await Joi.compile(validSchema)
            .prefs({ errors: { label: 'key' }, abortEarly: false })
            .validateAsync(object);

        Object.assign(req, value);
        next();
    } catch (error) {
        let errorMessage = 'Validation failed';

        if (error.details && Array.isArray(error.details)) {
            errorMessage = error.details
                .map(details => details.message)
                .join(', ');
        } else if (error.message) {
            errorMessage = error.message; // Fallback to the generic error message if details are not available
        }

        // Use your ApiError class to handle errors
        next(new ServerError(httpStatus.BAD_REQUEST, errorMessage));
    }
};

export default validate;
