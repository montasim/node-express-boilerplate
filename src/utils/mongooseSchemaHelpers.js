/**
 * @fileoverview Mongoose Schema Helpers Module for Node.js Applications.
 *
 * This module provides a collection of utility functions and middleware designed to enhance Mongoose schema
 * definitions and operations in MongoDB-backed Node.js applications. By addressing common requirements such as
 * generating unique identifiers, creating and validating usernames, managing custom IDs and timestamps, and ensuring
 * referential integrity, this module streamlines database-related tasks and enhances data integrity and usability.
 *
 * Key functionalities include:
 * - Generating unique identifiers and usernames with customizable prefixes and retry mechanisms for ensuring uniqueness.
 * - Automatically adding pre-save middleware to Mongoose schemas for managing custom document IDs and `createdAt` and
 *   `updatedAt` timestamps, reducing boilerplate code and ensuring consistency across documents.
 * - Creating asynchronous validator functions to check for the existence of referenced documents, improving referential integrity.
 * - Enhancing schemas with common audit fields (`createdBy`, `updatedBy`, `createdAt`, and `updatedAt`) and associated validations,
 *   supporting comprehensive audit trails and accountability in application data.
 *
 * These utilities are designed to be modular and easily integrated into various Mongoose schema definitions, providing a robust
 * foundation for building secure, maintainable, and feature-rich Node.js applications that interact with MongoDB databases.
 */

import mongoose from 'mongoose';

import UserModel from '../modules/user/user.model.js';

/**
 * Generates a unique identifier string that consists of a user-defined prefix, a formatted timestamp,
 * and a pseudo-random number. The timestamp is based on the current date and time, formatted as
 * `YYYYMMDDHHMMSS`, ensuring that the ID includes the year, month, day, hour, minute, and second.
 * The pseudo-random number adds a layer of uniqueness.
 *
 * This function is useful for scenarios where unique strings are necessary, such as file naming,
 * generating unique transaction IDs, or any other case where a distinct identifier is beneficial.
 *
 * @param {string} prefix A user-defined prefix to prepend to the unique identifier. This helps in categorizing
 *                        or differentiating the generated IDs based on their usage or origin.
 * @returns {string} A string that combines the prefix, a timestamp, and a pseudo-random number,
 *                   structured as `prefix-YYYYMMDDHHMMSS-randomNumber`.
 * @example
 * // Generate a unique ID with a prefix
 * const uniqueFileId = generateUniqueIdWithPrefix('file');
 * console.log(uniqueFileId);
 * // Outputs something like: 'file-20230307123045-1234567890'
 *
 * const transactionId = generateUniqueIdWithPrefix('txn');
 * console.log(transactionId);
 * // Outputs something like: 'txn-20230307123045-0987654321'
 */
const generateUniqueIdWithPrefix = prefix => {
    const currentDate = new Date();
    const uniqueId = Math.random().toString().slice(2, 12); // Generating a pseudo-unique ID for simplicity
    const formattedDate = `${currentDate.getFullYear()}${(
        currentDate.getMonth() + 1
    )
        .toString()
        .padStart(2, '0')}${currentDate
        .getDate()
        .toString()
        .padStart(2, '0')}${currentDate
        .getHours()
        .toString()
        .padStart(2, '0')}${currentDate
        .getMinutes()
        .toString()
        .padStart(2, '0')}${currentDate
        .getSeconds()
        .toString()
        .padStart(2, '0')}`;

    return `${prefix}-${formattedDate}-${uniqueId}`;
};

/**
 * Generates a unique username by sanitizing the input name to remove non-alphanumeric characters,
 * converting it to lowercase, and appending a current timestamp. This method ensures that each
 * generated username is unique and can be used for creating user accounts, identifiers, or any
 * other entities that require a unique and human-readable identifier.
 *
 * @param {string} name The input name to be sanitized and used as the base for the username.
 * @returns {string} A unique username consisting of the sanitized, lowercase name followed by an
 *                   underscore and the current timestamp.
 * @example
 * // Generate a unique username from a given name
 * const username1 = generateUserName('John Doe');
 * console.log(username1); // Output: "johndoe_1582605070000"
 *
 * const username2 = generateUserName('Jane_Doe!');
 * console.log(username2); // Output: "janedoe_1582605080000"
 */
const generateUserName = name => {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const timestamp = Date.now().toString();

    return `${cleanName}_${timestamp}`;
};

/**
 * Generates a unique username by appending a timestamp to a sanitized version of the provided name,
 * and checks for uniqueness against a database. If the initially generated username already exists,
 * it retries until a unique one is found or a specified retry limit is reached. This function is useful
 * in scenarios where username uniqueness is mandatory, such as user registration processes.
 *
 * The username is generated by removing non-alphanumeric characters from the name, converting it to
 * lowercase, and appending a current timestamp. The function then checks if this username exists in
 * the database, and retries the generation process with a new timestamp if necessary.
 *
 * @param {string} name The base name to be used for generating the initial part of the username.
 * @param {number} [retryLimit=50] The maximum number of attempts to generate a unique username before throwing an error. Defaults to 50.
 * @returns {Promise<string>} A promise that resolves to a unique username.
 * @throws {Error} Throws an error if a unique username cannot be generated within the specified retry limit.
 * @example
 * // Generate a unique username with default retry limit
 * generateUserNameWithRetry('John Doe')
 *   .then(username => console.log(`Generated username: ${username}`))
 *   .catch(error => console.error(error));
 *
 * // Generate a unique username with a custom retry limit
 * generateUserNameWithRetry('Jane Doe', 100)
 *   .then(username => console.log(`Generated username: ${username}`))
 *   .catch(error => console.error(error));
 */
const generateUserNameWithRetry = async (name, retryLimit = 50) => {
    let username;
    let retries = 0;

    do {
        username = generateUserName(name);
        const exists = await UserModel.findOne({ userName: username }).lean();

        if (!exists) return username; // If the username is unique, return it

        retries++;
    } while (retries < retryLimit);

    throw new Error(
        `Failed to generate a unique username after ${retryLimit} attempts.`
    );
};

/**
 * Enhances a Mongoose schema by adding pre-save middleware that automatically sets or updates
 * custom ID and timestamps before saving a document. When a new document is created, this
 * middleware generates a unique ID using a specified prefix and sets the `createdAt` timestamp while
 * leaving the `updatedAt` timestamp undefined. For existing documents being updated, it updates the
 * `updatedAt` timestamp to the current time.
 *
 * This approach is useful for schemas where custom IDs are preferred over MongoDB's default ObjectID,
 * and for maintaining consistent `createdAt` and `updatedAt` fields without manually setting them
 * on every document save operation.
 *
 * @param {mongoose.Schema} schema The Mongoose schema to which the middleware should be added.
 * @param {string} idPrefix A string prefix used in generating the custom document ID. This prefix
 *                          can help identify the type of the document or its originating schema.
 * @example
 * const userSchema = new mongoose.Schema({
 *   id: String,
 *   name: String,
 *   email: String,
 *   createdAt: Date,
 *   updatedAt: Date,
 * });
 *
 * // Add custom ID and timestamp handling to the user schema
 * addPreSaveMiddlewareForTimestampsAndId(userSchema, 'user');
 *
 * // Now, every time a User document is saved, it will automatically have a custom ID with 'user' prefix
 * // and managed `createdAt` and `updatedAt` fields.
 */
const addPreSaveMiddlewareForTimestampsAndId = (schema, idPrefix) => {
    schema.pre('save', function (next) {
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
 * Creates an asynchronous validator function that checks for the existence of a document in a
 * specified collection by ID. This validator can be used in Mongoose schema definitions to ensure
 * referential integrity, for example, verifying that a referenced document exists before saving or
 * updating the current document.
 *
 * The generated validator uses the model name to find the corresponding collection and then checks
 * for the existence of a document with the specified ID. If no such document exists, it throws an
 * error with the provided custom error message.
 *
 * @param {string} modelName The name of the Mongoose model corresponding to the collection in which
 *                           the existence of the document will be checked.
 * @param {string|number} id The ID of the document to check for in the specified collection.
 * @param {string} errorMessage The custom error message to throw if the document does not exist.
 * @returns {Function} An asynchronous validator function that can be used in Mongoose schema definitions.
 * @example
 * // Creating a validator for a user schema to ensure a referenced department exists
 * const userSchema = new mongoose.Schema({
 *   name: String,
 *   departmentId: {
 *     type: mongoose.SchemaTypes.ObjectId,
 *     validate: {
 *       validator: createDocumentExistenceValidator('Department', this.departmentId, 'Department does not exist'),
 *       message: 'Department does not exist',
 *     }
 *   }
 * });
 *
 * // The validator will check if a Department document exists with the given departmentId
 * // before saving or updating a User document.
 */
const createDocumentExistenceValidator = (modelName, id, errorMessage) => {
    return async function () {
        const count = await mongoose
            .model(modelName)
            .countDocuments({ id: id });

        if (count > 0) {
            return true;
        }

        throw new Error(errorMessage);
    };
};

/**
 * Enhances a given Mongoose schema by adding common fields for audit purposes, including `createdBy`,
 * `updatedBy`, `createdAt`, and `updatedAt`. The `createdBy` and `updatedBy` fields are set to reference
 * User documents, ensuring that each document created or updated can be traced back to the user responsible
 * for the action. This function also adds validation to the `createdBy` and `updatedBy` fields to ensure
 * referenced User documents exist. Default values are provided for `createdAt` and `updatedAt` fields to
 * automatically track when documents are created and updated.
 *
 * @param {mongoose.Schema} schema The Mongoose schema to be enhanced with common fields.
 * @example
 * const mySchema = new mongoose.Schema({ name: String });
 * addCommonSchemaFields(mySchema);
 * // Now, mySchema includes `createdBy`, `updatedBy`, `createdAt`, and `updatedAt` fields
 * // with appropriate types, references, and validations.
 */
const addCommonSchemaFields = schema => {
    schema.add({
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            validate: {
                validator: createDocumentExistenceValidator(
                    'User',
                    'Invalid createdBy ID. The referenced admin does not exist.'
                ),
                message:
                    'Invalid createdBy ID. The referenced admin does not exist.',
            },
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            validate: {
                validator: createDocumentExistenceValidator(
                    'User',
                    'Invalid updatedBy ID. The referenced admin does not exist.'
                ),
                message:
                    'Invalid updatedBy ID. The referenced admin does not exist.',
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
    generateUserName,
    generateUserNameWithRetry,
    addPreSaveMiddlewareForTimestampsAndId,
    createDocumentExistenceValidator,
    addCommonSchemaFields,
};

export default mongooseSchemaHelpers;
