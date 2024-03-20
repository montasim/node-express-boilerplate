import mongoose from 'mongoose';
import toJSON from '../../../plugins/toJSON.plugin.js';
import tokenTypes from '../../../config/tokens.config.js';
import mongooseSchemaHelpers from '../../../utils/mongooseSchemaHelpers.js';

const tokenSchema = mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            index: true,
        },
        user: {
            type: String,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: [
                tokenTypes.REFRESH,
                tokenTypes.RESET_PASSWORD,
                tokenTypes.VERIFY_EMAIL,
            ],
            required: true,
        },
        expires: {
            type: Date,
            required: true,
        },
        blacklisted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// add a plugin that converts mongoose to json
tokenSchema.plugin(toJSON);

// Pre-save middleware to generate and assign the custom id
tokenSchema.pre('save', function (next) {
    // Only generate a new id if the document is new
    if (this.isNew) {
        this.user = mongooseSchemaHelpers.generateUniqueIdWithPrefix('user');
    }

    next();
});

/**
 * @typedef TokenModel
 */
const TokenModel = mongoose.model('Token', tokenSchema);

export default TokenModel;
