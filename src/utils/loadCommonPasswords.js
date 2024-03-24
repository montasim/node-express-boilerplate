/**
 * @fileoverview Common Passwords Loader Module for Node.js Applications.
 *
 * This module provides a utility function designed to enhance application security by facilitating the validation
 * of user-chosen passwords against a list of commonly used passwords. It aims to prevent the use of weak and easily
 * guessable passwords, thus reinforcing password policies and promoting stronger security practices among users.
 *
 * The core functionality revolves around asynchronously reading a text file containing a predefined list of common
 * passwords, each listed on a new line. This function processes the file by trimming whitespace, normalizing each
 * password to lowercase, and compiling them into a Set for efficient querying. The resulting Set enables quick
 * lookups, allowing applications to easily check if a user's password choice matches any of the known common
 * passwords.
 *
 * Implemented with Node.js's file system promises (fs/promises) and path utilities, this module exemplifies
 * handling asynchronous file operations and path manipulations to load critical data for application security
 * measures. It's designed to be integrated into authentication and account management flows, specifically in
 * password creation and update processes, to enforce better password selection by users.
 */

import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Derive the __dirname equivalent for ES6 module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Asynchronously loads a list of common passwords from a text file and returns them as a Set. This function is
 * designed to support security features in applications by enabling checks against common passwords, thereby
 * encouraging users to choose stronger, more secure passwords.
 *
 * The function reads a predefined list of passwords from a text file, where each password is expected to be on a
 * new line. It trims whitespace from each line, converts each password to lowercase for normalization, and adds
 * them to a Set for easy and efficient lookups.
 *
 * @returns {Promise<Set<string>>} A promise that resolves to a Set containing the list of common passwords. In
 *                                  the case of an I/O error (e.g., if the file is not found or unreadable), the
 *                                  promise resolves to an empty Set.
 * @example
 * // Example usage of loadCommonPasswords
 * loadCommonPasswords()
 *   .then(commonPasswords => {
 *     if (commonPasswords.has(userPassword.toLowerCase())) {
 *       console.log('Password is too common!');
 *     } else {
 *       console.log('Password is unique enough.');
 *     }
 *   })
 *   .catch(error => {
 *     console.error('Failed to load common passwords:', error);
 *   });
 */
const loadCommonPasswords = async () => {
    const filePath = join(__dirname, '../shared/commonPasswords.txt');

    try {
        const data = await fs.readFile(filePath, { encoding: 'utf-8' });
        const lines = data.split('\n').map(line => line.trim().toLowerCase());

        return new Set(lines);
    } catch (err) {
        console.error('Error loading the common password list:', err);

        return new Set(); // Return an empty set on error
    }
};

export default loadCommonPasswords;
