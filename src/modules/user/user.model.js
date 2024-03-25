/**
 * @fileoverview User Model Definition for Node.js Express API with MongoDB.
 *
 * This module defines the Mongoose schema for User documents, incorporating fields for authentication,
 * authorization, personal information, and system-generated metadata. It employs rigorous validation,
 * custom middleware, and utility functions to ensure data integrity, security, and the facilitation of
 * common tasks such as password hashing and uniqueness checks for emails and usernames.
 *
 * Key features include:
 * - Comprehensive data validation for emails, passwords, mobile numbers, and more, utilizing custom validators
 *   and third-party libraries to ensure that user data adheres to specified criteria for format and security.
 * - Password hashing using bcryptjs before storing user documents in the database, safeguarding user credentials.
 * - Custom static and instance methods such as `isEmailTaken` and `isPasswordMatch` to support common user-related
 *   operations, like checking for email uniqueness and authenticating user login attempts.
 * - Pre-save middleware to automatically handle tasks like unique ID generation for new users, username creation,
 *   and password hashing, streamlining document preparation and saving processes.
 * - Integration with pagination and toJSON plugins, enhancing API response handling and data presentation.
 *
 * The User model is a core component of the application's user management system, enabling secure and efficient
 * handling of user data for authentication, authorization, and profile management functionalities.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

import paginate from '../../plugins/paginate.plugin.js';
import toJSON from '../../plugins/toJSON.plugin.js';
import loadCommonPasswords from '../../utils/loadCommonPasswords.js';

import mongooseSchemaHelpers from '../../utils/mongooseSchemaHelpers.js';
import constants from '../../constants/constants.js';
import config from '../../config/config.js';
import RoleModel from '../auth/role/role.model.js';

const { Schema } = mongoose;

/**
 * Asynchronous password validator for Mongoose schema definitions. This validator ensures that passwords meet
 * specified security criteria, including length requirements, character diversity (uppercase, lowercase, digits,
 * and special characters), avoidance of simple patterns, and a check against a list of common passwords to prevent
 * the use of easily guessable passwords.
 *
 * The validation process includes:
 * - Ensuring the password is between 8 and 20 characters in length.
 * - Verifying that the password contains at least one uppercase letter, one lowercase letter, one digit, and
 *   one special character.
 * - Checking for simple patterns or commonly used passwords (e.g., "1234", "password").
 * - Comparing the password against a set of common passwords loaded asynchronously to prevent the use of
 *   well-known weak passwords.
 *
 * This validator is designed to be used in Mongoose schemas for user models where secure password storage is
 * essential. It throws descriptive errors for each type of validation failure to aid in correcting the input.
 *
 * @property {Function} validator The asynchronous validation function that performs the checks and throws an
 *                                Error if the password does not meet the criteria.
 * @property {string} message The default error message returned if password validation fails.
 * @example
 * const userSchema = new mongoose.Schema({
 *   username: String,
 *   password: {
 *     type: String,
 *     validate: passwordValidation
 *   }
 * });
 *
 * // Creating a user with an invalid password will trigger the validation and throw an error.
 * User.create({ username: 'testUser', password: 'weak' })
 *   .catch(error => console.error(error.message));
 */
const passwordValidation = {
    validator: async function (value) {
        // Check minimum and maximum length
        if (value?.length < 8 || value?.length > 20) {
            throw new Error('Password must be between 8 and 20 characters');
        }

        // Combined regex checks for efficiency
        if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/.test(value)) {
            throw new Error(
                'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character'
            );
        }

        // Example simple pattern check (sequential characters or too simple)
        if (
            value?.match(/^(.)\1+$/) ||
            value === '1234' ||
            value?.toLowerCase() === 'password'
        ) {
            throw new Error(
                'Password contains a simple pattern or is a common password'
            );
        }

        // Check against common passwords asynchronously
        const commonPasswords = await loadCommonPasswords();
        if (commonPasswords?.has(value)) {
            throw new Error('Use of common password is not allowed');
        }
    },
    message: 'Password validation failed',
};

/**
 * Defines the schema for User documents in the database. This schema includes fields for user identification,
 * authentication information, role-based authorization, contact information, and audit metadata such as creation
 * and update timestamps. Each field is carefully validated to ensure data integrity and security, including
 * custom validators for email addresses, mobile numbers, and password strength.
 *
 * Additionally, this schema includes fields for managing user account status, such as lockout mechanisms and
 * verification flags for email and mobile numbers, enhancing the application's security posture by supporting
 * account recovery processes and preventing unauthorized access.
 *
 * Fields:
 * - `id`: A unique identifier for the user.
 * - `userName`: The user's chosen username, unique across the application.
 * - `name`: The user's full name, with length and pattern restrictions.
 * - `email`: The user's email address, unique and validated for format.
 * - `mobile`: The user's mobile number, unique and validated for a specific pattern.
 * - `password`: The user's password, with length and complexity validations.
 * - `role`: Reference to the user's role, impacting authorization decisions.
 * - `picture`: Object containing links to the user's profile picture.
 * - `dateOfBirth`: The user's date of birth.
 * - `isEmailVerified`: Flag indicating whether the user's email is verified.
 * - `isLocked`, `lockDuration`, `isActive`: Fields managing the user's account status.
 * - `createdBy`, `updatedBy`: Audit fields tracking who created or last updated the user record.
 * - `createdAt`, `updatedAt`: Timestamps for record creation and last update.
 *
 * This schema is designed to support a robust user management system within the application, providing
 * a solid foundation for features such as authentication, authorization, and account recovery.
 */
const userSchema = Schema({
    id: {
        type: String,
        unique: true,
    },
    userName: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
        trim: true,
        required: [true, 'Please add your name'],
        minlength: [3, 'Name must be less than 3 characters long'],
        maxlength: [50, 'Name must be less than 50 characters long'],
        validate: {
            validator: async value => {
                if (!constants.namePattern.test(value)) {
                    return false; // Pattern does not match
                }

                return true;
            },
            message: props =>
                `${props.value} is not a valid name. Name must start with an uppercase letter and contain only letters.`,
        },
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: [true, 'Please add your email'],
        unique: [true, 'Email already taken. Please use a different email.'],
        validate: {
            validator: async value => {
                if (!validator.isEmail(value)) {
                    throw new Error('Invalid email');
                }

                return true;
            },
            message: props => `${props.value} is not a valid email.`,
        },
    },
    mobile: {
        type: String,
        trim: true,
        unique: [
            true,
            'Mobile number already taken. Please use a different mobile number.',
        ],
        validate: {
            validator: async value => {
                if (!constants.bangladeshiMobileRegex.test(value)) {
                    return false; // Pattern does not match
                }

                return true;
            },
            message: props =>
                `${props.value} is not a valid mobile number. Only valid Bangladeshi mobile numbers are allowed.`,
        },
    },
    password: {
        type: String,
        trim: true,
        required: [true, 'Please add a password'],
        minlength: [8, 'Password must be at least 8 characters long'],
        maxlength: [20, 'Password must be less than 20 characters long'],
        validate: passwordValidation,
        private: true, // used by the toJSON plugin
    },
    role: {
        type: String,
        trim: true,
        ref: 'Role',
        validate: {
            validator: async value => {
                // First, check if the role ID matches the custom ID pattern
                if (!constants.roleIdPattern.test(value)) {
                    return false; // Immediately return false if the pattern does not match
                }

                // Proceed to check for the role's existence in the database only if the pattern matches
                const roleExists = await RoleModel.findOne({ id: value });

                // Check if a role was found
                if (roleExists?.length > 0) {
                    return false; // Role does not exist
                }

                return true; // Role exists
            },
            message:
                'Invalid role: Either the role ID format is incorrect or the role does not exist.',
        },
    },
    picture: {
        fileId: {
            type: String,
            maxlength: [
                100,
                'Picture fileId must be less than 100 characters long',
            ],
        },
        shareableLink: {
            type: String,
            maxlength: [
                500,
                'Picture shareableLink must be less than 500 characters long',
            ],
        },
        downloadLink: {
            type: String,
            maxlength: [
                500,
                'Picture downloadLink must be less than 500 characters long',
            ],
        },
    },
    dateOfBirth: {
        type: Date,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isEmailMobile: {
        type: Boolean,
        default: false,
    },
    maximumLoginAttempts: {
        type: Number,
        default: config.auth.loginAttempts,
    },
    maximumResetPasswordAttempts: {
        type: Number,
        default: config.auth.resetPasswordAttempts,
    },
    maximumEmailVerificationAttempts: {
        type: Number,
        default: config.auth.verifyEmailAttempts,
    },
    maximumChangeEmailAttempts: {
        type: Number,
        default: config.auth.changeEmailAttempts,
    },
    maximumChangePasswordAttempts: {
        type: Number,
        default: config.auth.changePasswordAttempts,
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
    lockDuration: {
        type: Date,
    },
    isActive: {
        type: Boolean,
    },
    createdBy: {
        type: String,
        ref: 'User',
        validate: {
            validator: function (v) {
                return constants.customIdPattern.test(v); // Matching the custom ID format
            },
            message: 'Invalid createdBy ID format.',
        },
    },
    updatedBy: {
        type: String,
        ref: 'User',
        validate: {
            validator: function (v) {
                return constants.customIdPattern.test(v); // Matching the custom ID format
            },
            message: 'Invalid updatedBy ID format.',
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
    },
});

// add a plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Checks if an email address is already taken by another user in the database. This method is useful
 * for validating email uniqueness during user registration or profile updates. It allows for an optional
 * exclusion of a user by ID, which is handy when checking email uniqueness in scenarios where a user's
 * own email should be considered valid during updates.
 *
 * @param {string} email The email address to check for uniqueness.
 * @param {string} [excludeUserId] An optional user ID to exclude from the uniqueness check. This is useful
 *                                 when updating an existing user's email to ensure the current user's email
 *                                 is not considered a duplicate.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the email is taken by another user,
 *                             or `false` if the email is unique.
 * @example
 * // Check if an email address is taken by another user
 * User.isEmailTaken('john.doe@example.com')
 *   .then(isTaken => {
 *     if (isTaken) {
 *       console.log('Email is already in use.');
 *     } else {
 *       console.log('Email is available.');
 *     }
 *   });
 *
 * // Check if an email address is taken, excluding a specific user ID
 * User.isEmailTaken('jane.doe@example.com', '5f8d04b5e47a5872abc12345')
 *   .then(isTaken => {
 *     if (isTaken) {
 *       console.log('Email is already in use by another user.');
 *     } else {
 *       console.log('Email is available or only used by the excluded user.');
 *     }
 *   });
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
    const user = await this.findOne({ email, id: { $ne: excludeUserId } });

    return !!user;
};

/**
 * Compares a plaintext password with the user's hashed password stored in the database. This method
 * utilizes bcrypt's compare function to securely check if the provided password matches the user's
 * password, making it an essential part of the authentication process.
 *
 * @param {string} password The plaintext password to be compared against the user's hashed password.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the provided
 *                             password matches the user's hashed password. Returns `true` if the
 *                             passwords match, otherwise `false`.
 * @example
 * // Example of using isPasswordMatch in an authentication flow
 * const user = await User.findOne({ email: 'john.doe@example.com' });
 * const isMatch = await user.isPasswordMatch('plaintextpassword');
 * if (isMatch) {
 *     console.log('Password matches!');
 * } else {
 *     console.log('Incorrect password.');
 * }
 */
userSchema.methods.isPasswordMatch = async function (password) {
    const user = this;

    return bcrypt.compare(password, user.password);
};

/**
 * Pre-save middleware for the User schema. This middleware is invoked before saving a user document to
 * the database, ensuring the application of necessary preprocessing steps. It performs three main functions:
 *
 * 1. Generates a unique ID for new users, using a helper function that prefixes IDs with 'user'.
 * 2. Generates a unique username for new users based on their name. This process includes retrying username
 *    generation in case of collisions, ensuring uniqueness.
 * 3. Hashes the user's password using bcrypt before saving, if the password field is new or modified. This
 *    step is crucial for maintaining security by never storing plaintext passwords.
 *
 * These preprocessing steps are essential for maintaining data integrity and security within the application.
 *
 * @param {Function} next A callback to signal the completion of the middleware function. Calling `next()`
 *                        proceeds with the save operation, or passes an error if one occurred.
 * @this {Document} The user document about to be saved.
 * @example
 * // Assuming userSchema is defined elsewhere and mongooseSchemaHelpers provides utility functions
 * userSchema.pre('save', async function (next) {
 *     // Middleware logic as defined above
 * });
 *
 * // Now, whenever a User document is saved, this middleware ensures the generation of unique IDs and usernames,
 * // and the secure hashing of passwords.
 */
userSchema.pre('save', async function (next) {
    const user = this;

    // Only generate a new id if the document is new
    if (this.isNew) {
        this.id = mongooseSchemaHelpers.generateUniqueIdWithPrefix('user');
    }

    // Only generate a new userName if the document is new
    if (this.isNew) {
        this.userName = await mongooseSchemaHelpers.generateUserNameWithRetry(
            user?.name
        );
    }

    // Only hash the password if it has been modified (or is new)
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(user?.password, 8);
    }

    next();
});

const UserModel = mongoose.model('User', userSchema);

export default UserModel;
