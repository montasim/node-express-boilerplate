/**
 * @fileoverview Initial System Setup Utility for Role-Based Access Control in Node.js Applications.
 *
 * This module contains a critical setup function intended for use during the initialization phase of an application,
 * or when resetting to default configurations. It automates the creation of essential roles, permissions, and a super
 * admin user within the system, laying the foundation for role-based access control (RBAC) and secure system management.
 *
 * The setup process encompasses several key operations:
 * 1. Creation of a predefined list of permissions essential for system operation, ensuring these permissions are
 *    available in the database for role assignments.
 * 2. Establishment of 'Admin' and 'Super Admin' roles, each associated with the full set of permissions, to delineate
 *    different levels of system access and control.
 * 3. Verification of the existence of a super admin user account, with automatic creation if such an account does not
 *    exist, ensuring there's always a user with highest level access for system administration tasks.
 * 4. Option to send a verification or notification email to the super admin upon account creation, facilitating
 *    immediate engagement with the system.
 *
 * This function is designed to be executed as part of the application's startup sequence or through a dedicated setup
 * script, encapsulating complex initialization logic into a single, manageable operation. By automating these steps,
 * the utility supports a smooth and secure start-up and configuration process for applications implementing robust
 * access control and user management features.
 */

import RoleModel from '../modules/auth/role/role.model.js';
import PermissionModel from '../modules/auth/permission/permission.model.js';
import UserModel from '../modules/user/user.model.js';
import config from '../config/config.js';
import loggerConfig from '../config/logger.config.js';
import EmailService from '../modules/email/email.service.js';

/**
 * Asynchronously sets up initial roles, permissions, and a super admin user in the system. This setup function is
 * critical for initializing the application with a predefined set of permissions and roles, and ensuring that a
 * super admin user exists with all permissions assigned.
 *
 * The function performs the following operations in sequence:
 * 1. Creates a list of permissions if they do not already exist in the database.
 * 2. Ensures that the 'Admin' and 'Super Admin' roles exist with all the created permissions.
 * 3. Checks for the existence of a super admin user and creates one if it doesn't exist, assigning the 'Super Admin'
 *    role to this user.
 * 4. Optionally sends a verification email to the super admin user upon creation.
 *
 * This function is typically called during the application's initial setup phase or when resetting the system to its
 * default state.
 *
 * @throws {Error} Throws an error if any part of the setup process fails, logging the error and rethrowing it for
 *                 higher-level error handling.
 * @example
 * setupInitialUserWithRoleAndPermissions()
 *   .then(() => console.log('Initial setup completed successfully.'))
 *   .catch(error => console.error('Failed during initial setup:', error));
 */
const setupInitialUserWithRoleAndPermissions = async () => {
    try {
        // Define permissions
        const permissions = [
            'role-create',
            'role-modify',
            'role-get',
            'role-update',
            'role-delete',
            'permission-create',
            'permission-modify',
            'permission-get',
            'permission-update',
            'permission-delete',
            'user-create',
            'user-modify',
            'user-get',
            'user-update',
            'user-delete',
        ];
        const createdBy = 'system-20240317230608-000000001'; // system user

        // Ensure permissions exist
        for (const permissionName of permissions) {
            const permissionExists = await PermissionModel.findOne({
                name: permissionName,
            });
            if (!permissionExists) {
                await PermissionModel.create({
                    name: permissionName,
                    createdBy,
                    isActive: true,
                });
            }
        }

        // Collect all permissions for the roles (improve efficiency for large datasets)
        const allPermissions = await PermissionModel.find({});
        const permissionMap = new Map(
            allPermissions?.map(permission => [
                permission?.name,
                permission?.id,
            ])
        ); // Efficiently create a permission ID map

        // Define roles
        const roles = [
            { name: 'Admin', permissions: [...permissionMap.values()] }, // Use permission IDs from the map
            { name: 'Super Admin', permissions: [...permissionMap.values()] },
        ];

        // Ensure roles exist (now with all permissions)
        for (const role of roles) {
            let roleDoc = await RoleModel.findOne({ name: role.name });

            const formattedRoleData = {
                name: role?.name,
                permissions: role?.permissions.map(permissionId => ({
                    permission: permissionId,
                })),
                createdBy,
                isActive: true,
            };

            if (!roleDoc) {
                await RoleModel.create(formattedRoleData);
            }
        }

        // Ensure the super admin user exists
        const superAdminEmail = config.admin.email;
        const superAdminPassword = config.admin.password;
        const superAdminExists = await UserModel.findOne({
            email: superAdminEmail,
        });

        if (!superAdminExists) {
            const adminRole = await RoleModel.findOne({
                name: 'Super Admin',
            });

            await UserModel.create({
                name: 'Super Admin',
                email: superAdminEmail,
                password: superAdminPassword,
                role: adminRole?.id,
                picture: null,
            });

            // Send the verification email
            await EmailService.sendVerificationEmail(
                superAdminEmail,
                superAdminPassword
            );
        }

        loggerConfig.info('⚙️ Initial setup completed successfully.');
    } catch (error) {
        loggerConfig.error('❌ Error during initial setup:', error);

        throw error; // Rethrow or handle as appropriate for your application
    }
};

export default setupInitialUserWithRoleAndPermissions;
