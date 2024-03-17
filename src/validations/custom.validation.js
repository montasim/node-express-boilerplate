import path from 'path';

import loadTempEmailDomains from '../utils/loadTempEmailDomains.js';
import loadCommonPasswords from '../utils/loadCommonPasswords.js';

const commonMessages = {
    string: 'must be a type of \'text\'',
    empty: 'cannot be an empty field',
    required: 'is a required field',
    boolean: 'should be a boolean',
    objectId: 'must be a valid ObjectId',
    email: 'must be a valid email',
    mobile: 'must be a valid mobile number',
    password: {
        length: 'must be between 3 and 20 characters',
        upperCase: 'must contain at least 1 uppercase letter',
        lowerCase: 'must contain at least 1 lowercase letter',
        digit: 'must contain at least 1 digit',
        specialChar: 'must contain at least 1 special character',
        common: 'use of common password is not allowed',
        pattern: 'contains a simple pattern or is too common',
    },
    file: {
        required: 'File is required',
        type: 'Unsupported file type',
        size: 'File size should not exceed', // Size will be appended dynamically
    },
};

const validators = {
    string: (fieldName) => Joi.string().messages({
        'string.base': `${fieldName} ${commonMessages.string}`,
        'string.empty': `${fieldName} ${commonMessages.empty}`,
        'any.required': `${fieldName} ${commonMessages.required}`,
    }),
    boolean: (fieldName) => Joi.bool().messages({
        'boolean.base': `${fieldName} ${commonMessages.boolean}`,
        'any.required': `${fieldName} ${commonMessages.required}`,
    }),
    objectId: (fieldName) => Joi.string().custom(objectId).messages({
        'string.base': `${fieldName} ${commonMessages.string}`,
        'string.empty': `${fieldName} ${commonMessages.empty}`,
        'any.custom': `${fieldName} ${commonMessages.objectId}`,
    }),
    // You can define more common validators here
};

const objectId = (value, helpers) => {
    if (!value.match(/^[0-9a-fA-F]{24}$/)) {
        return helpers.message('"{{#label}}" must be a valid mongo id');
    }

    return value;
};

const detailedIdValidator = (value, helpers) => {
    // Define the pattern to extract parts
    const pattern = /^([a-zA-Z0-9]+)-(\d{14})-(\d{8,10})$/;
    const match = value.match(pattern);

    if (!match) {
        // If the pattern does not match at all, provide a general error message
        return helpers.message('Invalid ID format. Expected format: prefix-YYYYMMDDHHMMSS-randomNumbers.');
    }

    // Extract parts based on the pattern
    const [, prefix, dateTime, randomNumbers] = match;

    // Validate each part - in this example, just showcasing how you might start,
    // For instance, validating the dateTime part could involve checking it represents a valid date
    // This is just a placeholder; actual validation logic would need to be more comprehensive

    if (prefix.length < 3) {
        return helpers.message('Invalid prefix in the ID. The prefix must be at least 3 characters long.');
    }

    if (randomNumbers.length < 8 || randomNumbers.length > 10) {
        return helpers.message('Invalid random number sequence in the ID. It must be 8 to 10 digits long.');
    }

    // If all validations pass
    return value; // Return the validated value
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

const file = (file, allowedExtensions, maxSize) => {
    if (!file) {
        return 'File is required.';
    }

    if (
        !allowedExtensions.test(path.extname(file.originalname).toLowerCase())
    ) {
        return 'Unsupported file type.';
    }

    if (file.size > maxSize) {
        return `File size should not exceed ${maxSize / 1024 / 1024}MB.`;
    }

    return true; // Indicate validation success
};

const CustomValidation = {
    objectId,
    detailedIdValidator,
    email,
    mobile,
    password,
    file,
};

export default CustomValidation;
