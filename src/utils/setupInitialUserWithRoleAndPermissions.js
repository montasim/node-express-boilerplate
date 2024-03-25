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
 *    exist, ensuring there's always a user with the highest level access for system administration tasks.
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
 * Sets up initial user roles and permissions in the database, ensuring the system is prepared with
 * a super admin user, admin and default roles, and specific permissions required for managing roles,
 * permissions, and users. This function performs several key operations:
 *
 * 1. Checks if specific permissions exist, and if not, creates them. These permissions include
 *    capabilities related to role and permission creation, viewing, modification, as well as user
 *    management functionalities.
 *
 * 2. Collects all existing permissions and maps them for easy access. Then, it defines three primary
 *    roles: Super Admin, Admin, and Default. The Super Admin and Admin roles are granted all available
 *    permissions, while the Default role has no permissions assigned.
 *
 * 3. Verifies the existence of these roles in the database and creates them if they do not exist,
 *    associating the defined permissions with each role accordingly.
 *
 * 4. Ensures the existence of a super admin user. If this user does not exist, the function creates
 *    it with the specified email and password, assigns it the Super Admin role, and sends a
 *    verification email to the user.
 *
 * If the setup completes successfully, it logs a success message. If any part of the process fails,
 * it logs the error and rethrows it for further handling. This is a crucial function for initializing
 * the application with essential data and should be executed as part of the application setup or
 * deployment process.
 *
 * @async
 * @function setupInitialUserWithRoleAndPermissions
 * @throws {Error} Throws an error if any part of the setup process fails.
 */
const setupInitialUserWithRoleAndPermissions = async () => {
    try {
        const permissionNames = [
            'role-create',
            'role-view',
            'role-modify',
            'permission-create',
            'permission-view',
            'permission-modify',
            'user-create',
            'user-view',
            'user-modify',
        ];
        const createdBy = 'system-20240317230608-000000001'; // system user identifier

        // Ensure permissions exist
        for (const permissionName of permissionNames) {
            const permissionExists = await PermissionModel.findOne({
                name: permissionName,
            });

            // Create the permission if it doesn't exist
            if (!permissionExists) {
                await PermissionModel.create({
                    name: permissionName,
                    createdBy,
                    isActive: true,
                });
            }
        }

        // Collect all permissions for the role
        const allPermissions = await PermissionModel.find({});
        const permissionMap = new Map(
            allPermissions.map(permission => [permission.name, permission.id])
        );

        // Define roles
        const roles = [
            { name: 'Super Admin', permissions: [...permissionMap.values()] },
            { name: 'Admin', permissions: [...permissionMap.values()] },
            { name: 'Default', permissions: [] },
        ];

        // Ensure roles exist
        for (const role of roles) {
            let roleDoc = await RoleModel.findOne({ name: role.name });

            if (!roleDoc) {
                await RoleModel.create({
                    name: role.name,
                    permissions: role.permissions.map(permissionId => ({
                        permission: permissionId,
                    })),
                    createdBy,
                    isActive: true,
                });
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

            // Send a verification email
            await EmailService.sendVerificationEmail(
                superAdminEmail,
                superAdminPassword
            );
        }

        loggerConfig.info('⚙️ Initial setup completed successfully.');
    } catch (error) {
        loggerConfig.error('❌ Error during initial setup:', error);

        throw error; // Rethrow or handle as appropriate
    }
};

export default setupInitialUserWithRoleAndPermissions;
