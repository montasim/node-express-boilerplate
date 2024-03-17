import mongoose from 'mongoose';

// Utility function to generate a unique ID
const generateUniqueIdWithPrefix = (prefix) => {
    const currentDate = new Date();
    const uniqueId = Math.random().toString().slice(2, 12); // Generating a pseudo-unique ID for simplicity
    const formattedDate = `${currentDate.getFullYear()}${
        (currentDate.getMonth() + 1).toString().padStart(2, '0')}${
        currentDate.getDate().toString().padStart(2, '0')}${
        currentDate.getHours().toString().padStart(2, '0')}${
        currentDate.getMinutes().toString().padStart(2, '0')}${
        currentDate.getSeconds().toString().padStart(2, '0')}`;

    return `${prefix}-${formattedDate}-${uniqueId}`;
};

// Middleware for handling createdAt and updatedAt
const addPreSaveMiddlewareForTimestampsAndId = (schema, idPrefix) => {
    schema.pre('save', function(next) {
        if (this.isNew) {
            this.updatedAt = undefined; // Don't set updatedAt on creation

            // Ensure this.idPrefix is set on the schema.
            this.id = generateUniqueIdWithPrefix(idPrefix); // Generate custom id using idPrefix
        } else if (this.isModified()) {
            this.updatedAt = Date.now(); // Update updatedAt only on document updates
        }

        next();
    });
};


/**
 * Validates if a document exists for a given model and ID.
 * @param {String} modelName The name of the mongoose model to validate against.
 * @param {mongoose.Types.ObjectId} id The document ID to find.
 * @param {String} errorMessage The error message to return if validation fails.
 * @return {Promise} A promise that resolves with a boolean indicating if the document exists.
 */
const createDocumentExistenceValidator = (modelName, id, errorMessage) => {
    return async function() {
        const count = await mongoose.model(modelName).countDocuments({ id: id });

        if (count > 0) {
            return true;
        }

        throw new Error(errorMessage);
    };
};

const addCommonSchemaFields = (schema) => {
    schema.add({
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            validate: {
                validator: createDocumentExistenceValidator('User', 'Invalid createdBy ID. The referenced admin does not exist.'),
                message: 'Invalid createdBy ID. The referenced admin does not exist.',
            },
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            validate: {
                validator: createDocumentExistenceValidator('User', 'Invalid updatedBy ID. The referenced admin does not exist.'),
                message: 'Invalid updatedBy ID. The referenced admin does not exist.',
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
};

const mongooseSchemaHelpers = {
    generateUniqueIdWithPrefix,
    addPreSaveMiddlewareForTimestampsAndId,
    createDocumentExistenceValidator,
    addCommonSchemaFields
};

export default mongooseSchemaHelpers;

