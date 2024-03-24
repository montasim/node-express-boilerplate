/**
 * @fileoverview Temporary Email Domain Loader Module for Node.js Applications.
 *
 * This module provides a crucial utility function for application security and user management processes,
 * aimed at identifying and blocking temporary (or disposable) email addresses during user registration,
 * profile updates, or within any context where email validation is necessary. The goal is to enhance the integrity
 * of user data by preventing the use of temporary email services that could undermine security policies and user accountability.
 *
 * It achieves this by asynchronously reading and processing a list of known temporary email domains from a text file. Each domain
 * is normalized to lowercase and trimmed of any extraneous whitespace to ensure consistent and efficient validation. These domains
 * are then compiled into a Set, providing a fast mechanism for checking if a user-provided email belongs to a temporary email service.
 *
 * Implemented using modern JavaScript features and Node.js's filesystem (fs/promises) and path modules, this utility simplifies the
 * inclusion of temporary email domain checks in applications, promoting better security practices and user data hygiene. The function
 * gracefully handles I/O errors by resolving to an empty Set, allowing the application to continue operation without interruption.
 */

import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Derive the __dirname equivalent for ES6 module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Asynchronously loads a list of temporary email domains from a text file and returns them as a Set.
 * This utility is useful for identifying and blocking temporary email addresses during user registration
 * or in any scenario where email address validation is required.
 *
 * The function reads a list of domains from a file where each domain is on a new line. It trims any
 * whitespace from each line, converts each domain to lowercase to ensure consistency, and collects
 * them into a Set for quick and efficient validation checks against user-provided email addresses.
 *
 * @returns {Promise<Set<string>>} A promise that resolves to a Set containing the list of temporary email domains.
 *                                  In the case of an I/O error (e.g., if the file is not found or unreadable),
 *                                  the promise resolves to an empty Set to gracefully handle the error.
 * @example
 * // Example usage of loadTempEmailDomains
 * loadTempEmailDomains()
 *   .then(tempEmailDomains => {
 *     const userEmailDomain = userEmail.split('@')[1].toLowerCase();
 *     if (tempEmailDomains.has(userEmailDomain)) {
 *       console.log('Please provide a non-temporary email address.');
 *     } else {
 *       console.log('Email address accepted.');
 *     }
 *   })
 *   .catch(error => {
 *     console.error('Failed to load temporary email domains:', error);
 *   });
 */
const loadTempEmailDomains = async () => {
    const filePath = join(__dirname, '../shared/tempEmailDomains.txt');

    try {
        const data = await fs.readFile(filePath, { encoding: 'utf-8' });
        const lines = data.split('\n').map(line => line.trim().toLowerCase());

        return new Set(lines);
    } catch (err) {
        console.error('Error loading the temporary email domain list:', err);

        return new Set(); // Return an empty set on error
    }
};

export default loadTempEmailDomains;
