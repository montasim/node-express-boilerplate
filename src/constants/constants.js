const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const customIdPattern = /^([a-zA-Z0-9]+)-(\d{14})-(\d{8,10})$/;
const emailRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const bangladeshiMobileRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
const upperCaseRegex = /[A-Z]/;
const lowerCaseRegex = /[a-z]/;
const digitsRegex = /\d/;
const specialCharRegex = /[\s~`!@#$%^&*+=\-[\]\\';,/{}|\\":<>?()._]/;
const permissionNamePattern = /^[a-z]+-(create|view|modify)$/;
const userNamePattern = /^[A-Z][a-zA-Z ]$/;
const roleNamePattern = /^[A-Z][a-zA-Z ]{2,49}$/;
const roleIdPattern = /^role-\d{14}-\d{10}$/;
const userIdPattern = /^user-\d{14}-\d{10}$/;
const permissionIdPattern = /^permission-\d{14}-\d{10}$/;

const constants = {
    objectIdPattern,
    customIdPattern,
    emailRegex,
    bangladeshiMobileRegex,
    upperCaseRegex,
    lowerCaseRegex,
    digitsRegex,
    specialCharRegex,
    roleIdPattern,
    permissionNamePattern,
    userIdPattern,
    userNamePattern,
    roleNamePattern,
    permissionIdPattern,
};

export default constants;
