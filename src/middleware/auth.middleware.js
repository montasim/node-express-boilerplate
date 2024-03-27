/**
 * @fileoverview Authentication and Authorization Middleware for Express.js Applications.
 *
 * This module provides a comprehensive solution for securing Express.js routes through both authentication
 * and fine-grained authorization mechanisms. It leverages Passport.js for JWT-based authentication, ensuring
 * that only requests from authenticated users are processed. Moreover, it extends this functionality by
 * implementing authorization checks that validate the authenticated user's rights to access specific resources
 * or perform certain actions, based on the roles and permissions model of the application.
 *
 * The core of this module is the `authMiddleware` function, which dynamically applies both authentication and
 * authorization checks to requests. It supports specifying required rights for accessing a route, enabling
 * fine-grained control over application resources. This dual-layer security approach is crucial for building
 * robust, secure applications that protect sensitive data and functionality from unauthorized access.
 *
 * Key Features:
 * - JWT-based authentication using Passport.js, ensuring that users are properly authenticated before accessing protected routes.
 * - Dynamic authorization checks that validate if the authenticated user has the necessary rights to access a route or perform an operation,
 *   based on a flexible roles and permissions model.
 * - Integration of a callback function (`verifyCallback`) within the authentication process to handle additional authorization requirements,
 *   providing a seamless mechanism for enforcing both authentication and authorization in a single step.
 *
 * Usage Scenario:
 * The `authMiddleware` can be easily integrated into any Express.js route to enforce security policies. It is designed to be versatile,
 * allowing for its application in various scenarios where different levels of access control are needed, from basic user authentication
 * to complex permission-based authorization schemes.
 */

import passport from 'passport';
import httpStatus from 'http-status';

import RoleAggregationPipeline from '../modules/auth/role/role.pipeline.js';
import RoleModel from '../modules/auth/role/role.model.js';

/**
 * Verifies the outcome of an authentication attempt and checks for additional authorization requirements.
 * This function is intended to be used as a callback for authentication middleware, handling errors,
 * ensuring the user is authenticated, and optionally verifying that the user has the necessary rights
 * to access specific resources. If authentication or authorization checks fail, it throws a `ServerError`
 * with appropriate HTTP status codes and messages.
 *
 * @param {Object} req The Express request object, used to attach the authenticated user and for accessing request parameters.
 * @param res
 * @param {Array<Array<string>>} requiredRights An array of rights required to access the resource. Each element in the array
 *                                              represents a specific right, allowing for fine-grained access control based on
 *                                              user roles and permissions.
 * @param user
 * @param info
 * @returns {Function} Returns an asynchronous function that serves as a callback for the authentication middleware. This callback
 *                     function takes `error`, `user`, and `info` parameters, where `error` is any authentication error, `user` is
 *                     the authenticated user object, and `info` provides additional information from the authentication process.
 * @throws {ServerError} Throws a `ServerError` with `httpStatus.UNAUTHORIZED` if authentication fails, or `httpStatus.FORBIDDEN`
 *                       if the user does not have the required rights to access the resource.
 * @example
 * // Example of using verifyCallback in an Express route with Passport.js
 * router.get('/protected-resource', passport.authenticate('jwt', { session: false }),
 *     verifyCallback(req, [['admin', 'read']]),
 *     (req, res) => {
 *         // Handle the request for the protected resource here
 *         res.json({ message: 'You have access to this protected resource.' });
 *     }
 * );
 */
const verifyCallback = async (req, res, requiredRights, user, info) => {
    if (!user || info) {
        const errorResponse = {
            success: false,
            status: httpStatus.UNAUTHORIZED,
            message: info?.message || 'Please authenticate.',
            data: {},
        };

        return res.status(errorResponse.status).json(errorResponse); // Ensure execution stops after sending response
    }

    req.sessionUser = user;

    if (requiredRights?.length) {
        const aggregationPipeline = RoleAggregationPipeline.getRole(user?.role);
        const populatedRole = await RoleModel.aggregate(aggregationPipeline);

        const hasRequiredRights = requiredRights.some(requiredRight =>
            populatedRole[0]?.permissions?.some(
                permission => permission?.name === requiredRight[0]
            )
        );

        if (!hasRequiredRights && req?.params?.userId !== user?.id) {
            const errorResponse = {
                success: false,
                status: httpStatus.FORBIDDEN,
                message:
                    'Forbidden. You do not have the required rights to access this resource.',
                data: {},
            };

            return res.status(errorResponse.status).json(errorResponse); // Ensure execution stops after sending response
        }
    }
};

/**
 * Creates authentication and authorization middleware for Express routes. This middleware uses Passport.js
 * to authenticate incoming requests with JWT tokens and verifies that the authenticated user has the required
 * rights to access the endpoint. It's designed to be flexible, allowing for easy integration of authentication
 * and fine-grained authorization in your application's routes.
 *
 * @param {...Array<string>} requiredRights A rest parameter representing the rights required to access the route.
 *                                          Each right is specified as a string, and the middleware will check that
 *                                          the authenticated user possesses all the specified rights.
 * @returns {Function} Returns an asynchronous Express middleware function that authenticates the request, checks
 *                     for the required rights, and either forwards the request to the next middleware in the stack
 *                     or sends an error response if authentication or authorization fails.
 * @example
 * // Use the authMiddleware to protect a route, requiring the 'admin' right
 * app.get('/admin', authMiddleware('admin'), (req, res) => {
 *     res.send('Welcome, admin!');
 * });
 *
 * // For routes requiring multiple rights, pass each right as a separate argument
 * app.post('/admin/data', authMiddleware('admin', 'write'), (req, res) => {
 *     res.send('Data saved!');
 * });
 */
const authMiddleware =
    (...requiredRights) =>
    async (req, res, next) => {
        passport.authenticate(
            'jwt',
            { session: false },
            async (error, user, info) => {
                if (error) {
                    const errorResponse = {
                        success: false,
                        status: httpStatus.UNAUTHORIZED,
                        message: 'Authentication error',
                        data: {},
                    };

                    return res.status(errorResponse.status).json(errorResponse);
                }

                try {
                    await verifyCallback(req, res, requiredRights, user, info);
                    next();
                } catch (err) {
                    // This catch block will handle exceptions thrown by verifyCallback
                    const errorResponse = {
                        success: false,
                        status: err.status || httpStatus.UNAUTHORIZED,
                        message: err.message || 'Authentication error',
                        data: {},
                    };

                    if (!res.headersSent) {
                        // Check if response is not yet sent to avoid ERR_HTTP_HEADERS_SENT
                        res.status(errorResponse.status).json(errorResponse);
                    }
                }
            }
        )(req, res, next);
    };

export default authMiddleware;
