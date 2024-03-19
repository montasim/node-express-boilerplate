import mongoose from 'mongoose';

import mongooseSchemaHelpers from '../../../utils/mongooseSchemaHelpers.js';
import PermissionConstants from './permission.constants.js';
import constants from '../../../constants/constants.js';

const { Schema } = mongoose;

const permissionSchema = new Schema({
    id: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
        unique: [true, 'Permission name must be unique'],
        required: [true, 'Please add the permission name'],
        minlength: [3, 'Permission name must be at least 3 characters long'],
        maxlength: [50, 'Permission name must be less than 50 characters long'],
        validate: {
            validator: async value => {
                // First, validate the pattern
                if (!PermissionConstants.PERMISSION_NAME_PATTERN.test(value)) {
                    return false; // Pattern does not match
                }

                // Extract modelName from the value
                const [modelName] = value.split('-');

                // Convert the first character to uppercase assuming model names are capitalized
                const capitalizedModelName =
                    modelName.charAt(0).toUpperCase() + modelName.slice(1);

                // Check against registered Mongoose models
                const modelNames = mongoose.modelNames();

                return modelNames.includes(capitalizedModelName);
            },
            message: props =>
                `${props.value} is not a valid permission name. It must follow the pattern modelName-action (where modelName is an existing Mongoose model and action is one of the following: create, modify, get, update, delete).`,
        },
    },
    isActive: {
        type: Boolean,
        required: [true, 'Please add the permission active or inactive status'],
    },
    createdBy: {
        type: String,
        required: [true, 'Please add the creator ID'],
        ref: 'User',
        validate: {
            // Adjusted validator for custom ID format
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
permissionSchema.pre('save', function (next) {
    // Only generate a new id if the document is new
    if (this.isNew) {
        this.id =
            mongooseSchemaHelpers.generateUniqueIdWithPrefix('permission');
    }

    next();
});

export default mongoose.model('Permission', permissionSchema);
