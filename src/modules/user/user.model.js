import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

import paginate from '../../plugins/paginate.plugin.js';
import toJSON from '../../plugins/toJSON.plugin.js';
import loadCommonPasswords from '../../utils/loadCommonPasswords.js';

import mongooseSchemaHelpers from '../../utils/mongooseSchemaHelpers.js';
import UserConstants from './user.constant.js';
import constants from '../../constants/constants.js';

const { Schema } = mongoose;

const passwordValidation = {
    validator: async function (value) {
        // Check minimum and maximum length
        if (value.length < 8 || value.length > 20) {
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
            value.match(/^(.)\1+$/) ||
            value === '1234' ||
            value.toLowerCase() === 'password'
        ) {
            throw new Error(
                'Password contains a simple pattern or is a common password'
            );
        }

        // Check against common passwords asynchronously
        const commonPasswords = await loadCommonPasswords();
        if (commonPasswords.has(value)) {
            throw new Error('Use of common password is not allowed');
        }
    },
    message: 'Password validation failed',
};

const userSchema = Schema({
    id: {
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
                if (!UserConstants.USER_NAME_PATTERN.test(value)) {
                    return false; // Pattern does not match
                }

                return true;
            },
            message: props =>
                `${props.value} is not a valid name. Only letters, periods, and hyphens are allowed.`,
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
        ref: 'Role',
        validate: {
            validator: function (v) {
                return constants.customIdPattern.test(v); // Matching the custom ID format
            },

            message: 'Invalid role ID format.',
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
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isEmailMobile: {
        type: Boolean,
        default: false,
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
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
    const user = await this.findOne({ email, id: { $ne: excludeUserId } });
    return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
    const user = this;
    return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
    const user = this;

    // Only generate a new id if the document is new
    if (this.isNew) {
        this.id = mongooseSchemaHelpers.generateUniqueIdWithPrefix('user');
    }

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

const UserModel = mongoose.model('User', userSchema);

export default UserModel;
