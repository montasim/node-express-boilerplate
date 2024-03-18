import Joi from 'joi';
import path from 'path';

import loadTempEmailDomains from '../utils/loadTempEmailDomains.js';
import loadCommonPasswords from '../utils/loadCommonPasswords.js';
import convertToSentenceCase from '../utils/convertToSentenceCase.js';

import constants from '../constants/constants.js';

const objectId = (value, helpers) => {
    if (!value.match(constants.objectIdPattern)) {
        return helpers.message('"{{#label}}" must be a valid mongo id');
    }

    return value;
};

const detailedIdValidator = (value, helpers) => {
    // Define the pattern to extract parts from the ID
    const match = value.match(constants.customIdPattern);

    if (!match) {
        // If the pattern does not match at all, provide a general error message
        return helpers.message(
            'Invalid ID format. Expected format: prefix-YYYYMMDDHHMMSS-randomNumbers.'
        );
    }

    // Extract parts based on the pattern
    const [, prefix, dateTime, randomNumbers] = match;

    // Validate each part - in this example, just showcasing how you might start,
    // For instance, validating the dateTime part could involve checking it represents a valid date
    // This is just a placeholder; actual validation logic would need to be more comprehensive

    if (prefix.length < 3) {
        return helpers.message(
            'Invalid prefix in the ID. The prefix must be at least 3 characters long.'
        );
    }

    if (randomNumbers.length < 8 || randomNumbers.length > 10) {
        return helpers.message(
            'Invalid random number sequence in the ID. It must be 8 to 10 digits long.'
        );
    }

    // If all validations pass
    return value; // Return the validated value
};

const name = (fieldname, pattern) => {
    const sentenceCaseFieldname = convertToSentenceCase(fieldname);

    return Joi.string()
        .min(3)
        .message(
            `${sentenceCaseFieldname} name must be at least 3 characters long`
        )
        .max(50)
        .message(
            `${sentenceCaseFieldname} name must be less than 50 characters long`
        )
        .pattern(pattern)
        .message(
            `${sentenceCaseFieldname} name must follow the pattern: ${pattern}.`
        )
        .messages({
            'string.empty': `Please add the ${fieldname} name`,
            'string.min': `${sentenceCaseFieldname} name must be at least 3 characters long`,
            'string.max': `${sentenceCaseFieldname} name must be less than 50 characters long`,
            'any.required': `${sentenceCaseFieldname} name is required`,
            'string.pattern.base': `${sentenceCaseFieldname} name must follow the pattern: ${pattern}.`,
        });
};

const email = async (value, helpers) => {
    // Regex to validate the email format
    const emailRegex = constants.emailRegex;

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
    const bdMobileRegex = constants.bangladeshiMobileRegex;

    // Check if the mobile number matches the Bangladeshi mobile number format
    if (!bdMobileRegex.test(value)) {
        return helpers.message(
            'Please enter a valid Bangladeshi mobile number'
        );
    }

    return value;
};

const password = async (value, helpers) => {
    // Check minimum and maximum length
    if (value.length < 3 || value.length > 20) {
        return helpers.message('Password must be between 3 and 20 characters');
    }

    // Check for at least one uppercase letter
    if (!constants.upperCaseRegex.test(value)) {
        return helpers.message(
            'Password must contain at least 1 uppercase letter'
        );
    }

    // Check for at least one lowercase letter
    if (!constants.lowerCaseRegex.test(value)) {
        return helpers.message(
            'Password must contain at least 1 lowercase letter'
        );
    }

    // Check for at least one digit
    if (!constants.digitsRegex.test(value)) {
        return helpers.message('Password must contain at least 1 digit');
    }

    // Check for at least one special character
    if (!constants.specialCharRegex.test(value)) {
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

const isActive = () => {
    return Joi.bool().valid(true, false).messages({
        'boolean.base': 'isActive must be a boolean value.',
        'any.only': 'isActive must be either true or false.',
        'any.required': 'isActive is required.',
    });
};

// Common Parameter Validation for permissionId
const id = () => {
    return Joi.string().custom(detailedIdValidator);
};

// Common Error Messages for Queries
const queryErrorMessages = () => {
    return {
        'object.unknown':
            'You have used an unknown parameter. Please check your request against the API documentation.',
    };
};

const page = () => {
    return Joi.number().integer().min(1).messages({
        'number.base': 'Page must be a number.',
        'number.integer': 'Page must be an integer.',
        'number.min': 'Page must be at least 1.',
    });
};

const limit = () => {
    return Joi.number().integer().min(1).max(100).messages({
        'number.base': 'Limit must be a number.',
        'number.integer': 'Limit must be an integer.',
        'number.min': 'Limit must be at least 1.',
        'number.max': 'Limit must not exceed 100.',
    });
};

const sortBy = () => {
    return Joi.string().valid('name', 'createdAt', 'updatedAt').messages({
        'string.base': 'sortBy must be a string.',
        'any.only':
            'sortBy must be one of the following: name, createdAt, updatedAt.',
    });
};

const createdBy = () => {
    return Joi.string().messages({
        'string.base': 'createdBy must be a string.',
    });
};

const updatedBy = () => {
    return Joi.string().messages({
        'string.base': 'updatedBy must be a string.',
    });
};

const createdAt = () => {
    return Joi.string().isoDate().messages({
        'string.base': 'createdAt must be a string.',
        'string.isoDate': 'createdAt must be in ISO 8601 date format.',
    });
};

const updatedAt = () => {
    return Joi.string().isoDate().messages({
        'string.base': 'updatedAt must be a string.',
        'string.isoDate': 'updatedAt must be in ISO 8601 date format.',
    });
};

const CustomValidation = {
    objectId,
    id,
    detailedIdValidator,
    name,
    email,
    mobile,
    password,
    file,
    isActive,
    queryErrorMessages,
    page,
    limit,
    sortBy,
    createdAt,
    createdBy,
    updatedBy,
    updatedAt,
};

export default CustomValidation;
