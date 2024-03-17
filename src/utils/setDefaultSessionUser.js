import UserModel from '../modules/user/user.model.js';
import httpStatus from 'http-status';

const setDefaultSessionUser = async (sessionUser) => {
    if (!sessionUser) {
        // Get the default user
        const defaultSessionUser = await UserModel.findOne({
            id: 'user-20240317230608-000000001'
        });

        // If the current session user is not available, return an error
        if (!defaultSessionUser) {
            return {
                success: false,
                statusCode: httpStatus.FORBIDDEN,
                message: 'You are not authorized to perform this action',
                data: null,
            };
        }

        return defaultSessionUser;
    }
};

export default setDefaultSessionUser;
