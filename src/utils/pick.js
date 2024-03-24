/**
 * @fileoverview Object Property Picker Utility for Node.js Applications.
 *
 * This module introduces a lightweight and versatile utility function aimed at selectively extracting properties
 * from JavaScript objects. By providing a mechanism to specify a subset of properties to retain, this function
 * facilitates the creation of new objects that only include the desired key-value pairs from the original objects.
 * Such functionality is particularly valuable in scenarios requiring the segregation of sensitive data, data
 * transformation for API responses, or any situation where only a portion of an object's data is needed.
 *
 * The core of this utility lies in its ability to iterate through an array of property names (`keys`) and accumulate
 * them into a new object if they exist in the source object. This approach ensures that the resulting object is
 * composed exclusively of properties that are both specified by the caller and present in the source, thereby
 * maintaining the integrity of the operation and the relevance of the output.
 *
 * Implemented with efficiency and simplicity in mind, this function leverages JavaScript's `reduce` method to
 * streamline property selection, offering a concise and functional solution for object property filtering. It
 * exemplifies a practical application of functional programming principles in JavaScript, enhancing code readability,
 * maintainability, and performance in Node.js application development.
 */

/**
 * Creates an object composed of the properties of the given object that are specified in the `keys` array.
 * This utility function is useful for filtering an object by selecting a subset of its properties. It iterates
 * over the `keys` array and adds each key to the new object if the key exists in the original object. This is
 * particularly helpful for creating trimmed versions of objects containing only necessary data fields.
 *
 * @param {Object} object The source object from which to pick properties.
 * @param {string[]} keys An array of strings representing the keys of the properties to pick from the source object.
 * @returns {Object} A new object composed only of the properties specified by the `keys` array that exist in the source object.
 * @example
 * // Example object
 * const user = {
 *   id: 1,
 *   name: 'John Doe',
 *   password: 'secret',
 *   email: 'john.doe@example.com',
 * };
 *
 * // Picking only 'id' and 'email' from the object
 * const safeUser = pick(user, ['id', 'email']);
 * console.log(safeUser);
 * // Output: { id: 1, email: 'john.doe@example.com' }
 */
const pick = (object, keys) => {
    return keys.reduce((obj, key) => {
        if (object && Object.prototype.hasOwnProperty.call(object, key)) {
            // eslint-disable-next-line no-param-reassign
            obj[key] = object[key];
        }
        return obj;
    }, {});
};

export default pick;
