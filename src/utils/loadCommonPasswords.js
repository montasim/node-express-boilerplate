import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Derive the __dirname equivalent for ES6 module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to load blocked domains from a text file
const loadCommonPasswords = async () => {
    const filePath = join(__dirname, '../shared/commonPasswords.txt');

    try {
        const data = await fs.readFile(filePath, { encoding: 'utf-8' });
        const lines = data.split('\n').map(line => line.trim().toLowerCase());

        return new Set(lines);
    } catch (err) {
        console.error('Error loading the domain list:', err);

        return new Set(); // Return an empty set on error
    }
};

export default loadCommonPasswords;
