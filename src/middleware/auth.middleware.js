import passport from 'passport';
import httpStatus from 'http-status';
import Roles from '../config/roles.config.js';

import ServerError from '../utils/serverError.js';
import RoleAggregationPipeline from '../modules/auth/role/role.pipeline.js';
import RoleModel from '../modules/auth/role/role.model.js';

const verifyCallback = (req, requiredRights) => async (error, user, info) => {
    if (error || info || !user) {
        throw new ServerError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    req.user = user;

    if (requiredRights?.length) {
        const aggregationPipeline = RoleAggregationPipeline.getRole(user?.role);
        const populatedRole = await RoleModel.aggregate(aggregationPipeline);

        // Check if any of the required rights match the user's rights
        const hasRequiredRights = requiredRights.some(requiredRight =>
            populatedRole[0]?.permissions?.some(permission => {
                console.log(
                    'Permission:',
                    permission.name,
                    'Required Right:',
                    requiredRight[0]
                );

                return permission?.name === requiredRight;
            })
        );

        console.log('Has any required right:', hasRequiredRights);

        // Allow if the user has any required right or is accessing their own resource
        if (!hasRequiredRights && req.params.userId !== user?.id) {
            throw new ServerError(
                httpStatus.FORBIDDEN,
                'Forbidden. You do not have the required rights to access this resource.'
            );
        }
    }
};

const authMiddleware =
    (...requiredRights) =>
    async (req, res, next) => {
        try {
            await new Promise((resolve, reject) => {
                passport.authenticate(
                    'jwt',
                    { session: false },
                    (err, user, info) => {
                        try {
                                const verification = verifyCallback(
                                req,
                                requiredRights
                            );

                            verification(err, user, info)
                                .then(resolve)
                                .catch(reject);
                        } catch (error) {
                            reject(error);
                        }
                    }
                )(req, res, next);
            });

            next();
        } catch (err) {
            next(err);
        }
    };

export default authMiddleware;
