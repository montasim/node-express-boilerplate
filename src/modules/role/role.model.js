import mongoose from 'mongoose';

import mongooseSchemaHelpers from '../../utils/mongooseSchemaHelpers.js';
import RoleConstants from './role.constants.js';
import constants from '../../constants/constants.js';

const { Schema } = mongoose;

const permissionSchema = new Schema(
    {
        permission: {
            type: String,
            required: [true, 'Please add valid permission IDs'],
            ref: 'Permission',
            validate: {
                validator: function (v) {
                    return constants.customIdPattern.test(v);
                },
                message: 'Invalid permission ID format.',
            },
        },
    },
    { _id: false }
); // Disable automatic _id generation for permission objects

const roleSchema = new Schema({
    id: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
        unique: [true, 'Role name must be unique'],
        required: [true, 'Please add the role name'],
        minlength: [3, 'Role name must be at least 3 characters long'],
        maxlength: [50, 'Role name must be less than 50 characters long'],
        validate: {
            validator: async value => {
                if (!RoleConstants.ROLE_NAME_PATTERN.test(value)) {
                    return false; // Pattern does not match
                }
                return true;
            },
            message: props => `${props.value} is not a valid role name.`,
        },
    },
    permissions: [permissionSchema], // Use the defined permissionSchema for permissions
    isActive: {
        type: Boolean,
        required: [true, 'Please add the role active or inactive status'],
    },
    createdBy: {
        type: String,
        required: [true, 'Please add the creator ID'],
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

// Pre-save middleware to generate and assign the custom id
roleSchema.pre('save', function (next) {
    // Only generate a new id if the document is new
    if (this.isNew) {
        this.id = mongooseSchemaHelpers.generateUniqueIdWithPrefix('role');
    }

    next();
});

export default mongoose.model('Role', roleSchema);
