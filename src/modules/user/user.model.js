import mongoose from 'mongoose';

import paginate from '../../plugins/paginate.plugin.js';
import toJSON from '../../plugins/toJSON.plugin.js';

import validator from 'validator';
import bcrypt from 'bcryptjs';
import { roles } from '../../config/roles.js';

const { Schema } = mongoose;

const userSchema = Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new Error('Invalid email');
                }
            },
        },
        password: {
            type: String,
            required: true,
            trim: true,
            minlength: 8,
            validate(value) {
                if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
                    throw new Error(
                        'Password must contain at least one letter and one number'
                    );
                }
            },
            private: true, // used by the toJSON plugin
        },
        role: {
            type: String,
            enum: roles,
            default: 'user',
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
        createdBy: {
            type: Schema.Types.Mixed,
        },
        updatedBy: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

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
    const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
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
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

/**
 * @typedef UserModel
 */
const UserModel = mongoose.model('User', userSchema);

export default UserModel;
