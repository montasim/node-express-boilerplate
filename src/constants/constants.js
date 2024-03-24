const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const customIdPattern = /^([a-zA-Z0-9]+)-(\d{14})-(\d{8,10})$/;
const emailRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const bangladeshiMobileRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
const upperCaseRegex = /[A-Z]/;
const lowerCaseRegex = /[a-z]/;
const digitsRegex = /\d/;
const specialCharRegex = /[\s~`!@#$%^&*+=\-[\]\\';,/{}|\\":<>?()._]/;
const roleNamePattern = /^role-\d{14}-\d+$/;
const permissionNamePattern = /^[a-z]+-(create|modify|get|update|delete)$/;
const userNamePattern = /^user-\d{14}-\d+$/;

const constants = {
    objectIdPattern,
    customIdPattern,
    emailRegex,
    bangladeshiMobileRegex,
    upperCaseRegex,
    lowerCaseRegex,
    digitsRegex,
    specialCharRegex,
    roleNamePattern,
    permissionNamePattern,
    userNamePattern,
};

export default constants;
