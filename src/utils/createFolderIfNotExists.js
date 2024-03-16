import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Convert import.meta.url to __dirname equivalent
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the function
async function createFolderIfNotExists(directoryName) {
    try {
        const resolvedPath = path.resolve(__dirname, directoryName);
        if (!fs.existsSync(resolvedPath)) {
            fs.mkdirSync(resolvedPath, { recursive: true });
        }
    } catch (error) {
        console.error('Failed to create log directory:', error);
    }
}

// Export the function
export default createFolderIfNotExists;
