import loadTempEmailDomains from '../utils/loadTempEmailDomains.js';
import loadCommonPasswords from '../utils/loadCommonPasswords.js';

const objectId = (value, helpers) => {
    if (!value.match(/^[0-9a-fA-F]{24}$/)) {
        return helpers.message('"{{#label}}" must be a valid mongo id');
    }

    return value;
};

const email = async (value, helpers) => {
    // Regex to validate the email format
    const emailRegex =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    // Validate the email format
    if (!emailRegex.test(value)) {
        return helpers.message('Email must be a valid email');
    }

    // Extract domain from email
    const domain = value.split('@')[1].toLowerCase();

    // List of blocked or temporary email domains
    const blockedDomains = [
        'tempmail.com',
        'example.com', // Add more domains as needed
    ];

    // Check against blocked domains
    if (blockedDomains.includes(domain)) {
        return helpers.message('Use of emails from this domain is not allowed');
    }

    // Sample list of known temporary email domains
    const tempEmailDomains = await loadTempEmailDomains();

    // Check against temporary email domains
    if (tempEmailDomains.has(domain)) {
        return helpers.message(
            'Use of temporary email services is not allowed'
        );
    }

    // Check for '+number' pattern in the email local-part
    if (value.split('@')[0].match(/\+\d+$/)) {
        return helpers.message(
            'Emails with a "+number" pattern are not allowed'
        );
    }

    return value;
};

const mobile = (value, helpers) => {
    // Regex for validating Bangladeshi mobile numbers
    const bdMobileRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;

    // Check if the mobile number matches the Bangladeshi mobile number format
    if (!bdMobileRegex.test(value)) {
        return helpers.message(
            'Please enter a valid Bangladeshi mobile number'
        );
    }

    return value;
};

const password = async (value, helpers) => {
    // Define regex patterns to match requirements
    const hasUpperCase = /[A-Z]/;
    const hasLowerCase = /[a-z]/;
    const hasDigits = /\d/;
    const hasSpecialChar = /[\s~`!@#$%^&*+=\-[\]\\';,/{}|\\":<>?()._]/; // Adjust special characters as needed

    // Check minimum and maximum length
    if (value.length < 3 || value.length > 20) {
        return helpers.message('Password must be between 3 and 20 characters');
    }

    // Check for at least one uppercase letter
    if (!hasUpperCase.test(value)) {
        return helpers.message(
            'Password must contain at least 1 uppercase letter'
        );
    }

    // Check for at least one lowercase letter
    if (!hasLowerCase.test(value)) {
        return helpers.message(
            'Password must contain at least 1 lowercase letter'
        );
    }

    // Check for at least one digit
    if (!hasDigits.test(value)) {
        return helpers.message('Password must contain at least 1 digit');
    }

    // Check for at least one special character
    if (!hasSpecialChar.test(value)) {
        return helpers.message(
            'Password must contain at least 1 special character'
        );
    }

    // Example simple pattern check (sequential characters or too simple)
    // Adjust or enhance as needed for your definition of "simple patterns"
    if (
        value.match(/^(.)\1+$/) ||
        value === '1234' ||
        value.toLowerCase() === 'password'
    ) {
        return helpers.message(
            'Password contains a simple pattern or is a common password'
        );
    }

    // Consider integrating a more comprehensive check against a list of common passwords
    const commonPasswords = await loadCommonPasswords();

    // Check against common passwords
    if (commonPasswords.has(value)) {
        return helpers.message('Use of common password is not allowed');
    }

    // If all checks pass, return the value
    return value;
};

export { objectId, email, mobile, password };
