import RoleModel from '../modules/auth/role/role.model.js';
import PermissionModel from '../modules/auth/permission/permission.model.js';
import UserModel from '../modules/user/user.model.js';
import config from '../config/config.js';
import loggerConfig from '../config/logger.config.js';

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
            allPermissions.map(permission => [permission.name, permission.id])
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
                name: role.name,
                permissions: role.permissions.map(permissionId => ({
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
                password: config.admin.password,
                role: adminRole?.id,
                picture: null,
            });
        }

        loggerConfig.info('⚙️ Initial setup completed successfully.');
    } catch (error) {
        console.error('❌ Error during initial setup:', error);

        throw error; // Rethrow or handle as appropriate for your application
    }
};

// Export the function if you need to call it from elsewhere
export default setupInitialUserWithRoleAndPermissions;
