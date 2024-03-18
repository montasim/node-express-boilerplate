const permissionNamePattern = /^[a-z]+-(create|modify|get|update|delete)$/;

const permissionConstraints = {
    permissionNamePattern,
};

export default permissionConstraints;
