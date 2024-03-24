/**
 * @fileoverview Field Exclusion Utility for Object Manipulation in Node.js Applications.
 *
 * This utility module provides a function designed to enhance data privacy and security by
 * removing specified fields from an object. It is particularly beneficial when dealing with
 * sensitive data that should not be exposed to end-users or logged, such as passwords, personal
 * identification numbers, or any other confidential information.
 *
 * The primary functionality revolves around the selective exclusion of fields from an object,
 * effectively mutating the original object to omit the specified keys. This approach allows
 * developers to prepare data objects for transmission or logging by ensuring that sensitive
 * information is not inadvertently disclosed.
 *
 * Important to note is the mutative nature of this operation; the original object is directly
 * modified. Developers needing to preserve the original object are advised to create a deep
 * copy before applying this function.
 *
 * This module is indispensable in contexts where data handling and privacy are paramount,
 * offering a straightforward method to safeguard sensitive information within Node.js
 * backend environments.
 */

/**
 * Modifies the given object by removing specified fields. This function is particularly useful
 * for excluding sensitive or unnecessary information from an object, such as passwords or
 * personal identification numbers, before it is sent to the client or logged.
 *
 * Note: This function mutates the original object. If you need to keep the original object
 * intact, consider creating a copy before passing it to this function.
 *
 * @param {Object} details The object from which fields should be removed. This object is mutated.
 * @param {string[]} fields An array of string keys representing the fields to be excluded from the object.
 * @returns {Object} The modified object with the specified fields excluded.
 * @example
 * const userDetails = {
 *   username: 'johndoe',
 *   password: 'supersecretpassword',
 *   email: 'john.doe@example.com'
 * };
 * const safeUserDetails = excludeSensitiveFields(userDetails, ['password']);
 * console.log(safeUserDetails); // Outputs: { username: 'johndoe', email: 'john.doe@example.com' }
 */
const excludeSensitiveFields = (details, fields) => {
    fields?.forEach(field => delete details[field]);

    return details;
};

export default excludeSensitiveFields;
