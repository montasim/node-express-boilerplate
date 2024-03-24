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

const detailedIdValidator = (value, helpers, pattern) => {
    // Define the pattern to extract parts from the ID
    const match = value.match(constants.customIdPattern);

    if (!match) {
        // If the pattern does not match at all, provide a general error message
        return helpers.message(
            'Invalid ID format. Expected format: prefix-YYYYMMDDHHMMSS-randomNumbers.'
        );
    }

    // Extract parts based on the pattern
    const [input, prefix, dateTime, randomNumbers] = match;

    if (prefix.length < 3) {
        return helpers.message(
            'Invalid prefix in the ID. The prefix must be at least 3 characters long.'
        );
    }

    // Validate dateTime
    if (!/^\d{14}$/.test(dateTime)) {
        return helpers.message(
            'Invalid date and time format in the ID. Expected format: YYYYMMDDHHMMSS.'
        );
    }

    const year = parseInt(dateTime.substring(0, 4), 10);
    const month = parseInt(dateTime.substring(4, 6), 10) - 1; // Month is 0-indexed in JavaScript
    const day = parseInt(dateTime.substring(6, 8), 10);
    const hour = parseInt(dateTime.substring(8, 10), 10);
    const minute = parseInt(dateTime.substring(10, 12), 10);
    const second = parseInt(dateTime.substring(12, 14), 10);

    // Validate year
    if (year < 1900 || year > new Date().getFullYear()) {
        return helpers.message(
            'Invalid year in the provided ID. Year must be between 1900 and the current year.'
        );
    }

    // Validate month
    if (month < 1 || month > 12) {
        return helpers.message(
            'Invalid month in the provided ID. Month must be between 01 and 12.'
        );
    }

    // Validate day
    const maxDay = new Date(year, month, 0).getDate(); // Gets the last day of the previous month
    if (day < 1 || day > maxDay) {
        return helpers.message(
            `Invalid day in the provided ID. For the given month, day must be between 01 and ${maxDay}.`
        );
    }

    // Validate hour
    if (hour < 0 || hour > 23) {
        return helpers.message(
            'Invalid hour in the provided ID. Hour must be between 00 and 23.'
        );
    }

    // Validate minute
    if (minute < 0 || minute > 59) {
        return helpers.message(
            'Invalid minute in the provided ID. Minute must be between 00 and 59.'
        );
    }

    // Validate second
    if (second < 0 || second > 59) {
        return helpers.message(
            'Invalid second in the provided ID. Second must be between 00 and 59.'
        );
    }

    // Validate randomNumbers
    if (randomNumbers?.length !== 10) {
        return helpers.message(
            'Invalid random number sequence in the provided ID. It must be 10 digits long.'
        );
    }

    // Return the validated value if all validations pass
    return value;
};

const stringValidator = (fieldname, pattern, minLength, maxLength) => {
    const sentenceCaseFieldname = convertToSentenceCase(fieldname);

    return Joi.string()
        .min(minLength)
        .message(
            `${sentenceCaseFieldname} name must be at least ${minLength} characters long`
        )
        .max(maxLength)
        .message(
            `${sentenceCaseFieldname} name must be less than ${maxLength} characters long`
        )
        .pattern(pattern)
        .message(
            `${sentenceCaseFieldname} name must follow the pattern: ${pattern}.`
        )
        .messages({
            'string.empty': `Please add the ${fieldname} name`,
            'string.min': `${sentenceCaseFieldname} name must be at least ${minLength} characters long`,
            'string.max': `${sentenceCaseFieldname} name must be less than ${maxLength} characters long`,
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
    if (value.length < 8 || value.length > 20) {
        return helpers.message('Password must be between 8 and 20 characters');
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
const id = pattern => {
    return Joi.string()
        .trim()
        .custom((value, helpers) => {
            return detailedIdValidator(value, helpers, pattern);
        });
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
    stringValidator,
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
