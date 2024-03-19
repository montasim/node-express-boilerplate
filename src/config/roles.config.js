const allRoles = {
    user: [],
    admin: ['getUsers', 'manageUsers'],
};

const rolesConfig = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

const Roles = {
    rolesConfig,
    roleRights,
};

export default Roles;
