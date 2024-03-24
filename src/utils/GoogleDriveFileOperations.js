/**
 * @fileoverview Google Drive File Operations Module for Node.js Applications.
 *
 * This module provides an interface to Google Drive API for file operations, specifically
 * designed for uploading and deleting files within a Node.js backend environment. Leveraging the
 * Google APIs Node.js client library, it simplifies interacting with Google Drive by handling
 * authorization, file upload streams, permission setting, and file deletion through asynchronous
 * functions.
 *
 * Key functionalities include:
 * - Uploading files to Google Drive from a Node.js application, setting the uploaded files to be publicly
 *   accessible (anyone with the link can view), and retrieving shareable and downloadable links for the files.
 * - Deleting files from Google Drive using their unique file IDs, facilitating content management and cleanup.
 *
 * This module is particularly useful for applications requiring file storage solutions with the capability
 * to share and manage files programmatically. It abstracts the complexities involved in direct API interactions,
 * providing a set of easy-to-use functions for common file operations on Google Drive.
 */

import { google } from 'googleapis';
import { Readable } from 'stream';

import config from '../config/config.js';

import googleDriveConfig from '../config/googleDrive.config.js';

/**
 * Asynchronously uploads a file to Google Drive, sets the file permissions to public (anyone with the link can view),
 * and retrieves a shareable link for the file.
 *
 * The function handles the entire process of file upload, from initializing the Google Drive API client with the necessary
 * authorization, through uploading the file stream, to setting the file permissions and obtaining the shareable and download
 * links. It's designed to work with files uploaded via a web form or any other method where the file is available in a buffer.
 *
 * @param {Object} file An object representing the file to be uploaded. This should include properties like `originalname` for the file's name, `buffer` containing the file data, and `mimetype`.
 * @returns {Promise<Object>} A promise that resolves to an object containing the `fileId`, `shareableLink`, and `downloadLink` for the uploaded file. In case of an error during any step of the file upload process, the promise resolves to the error object.
 * @throws {Error} Throws an error if the Google Drive API interaction fails or the file cannot be uploaded or permission cannot be set.
 * @example
 * // Example of uploading a file received from a form submission
 * const file = {
 *   originalname: 'example.pdf',
 *   mimetype: 'application/pdf',
 *   buffer: Buffer.from('some file data'),
 * };
 *
 * uploadFile(file)
 *   .then(result => {
 *     console.log('File uploaded successfully:', result);
 *   })
 *   .catch(error => {
 *     console.error('Failed to upload file:', error);
 *   });
 */
const uploadFile = async file => {
    try {
        const authorizationClient = await googleDriveConfig();
        const drive = google.drive({
            version: 'v3',
            auth: authorizationClient,
        });
        const fileMetaData = {
            name: file?.originalname,
            parents: [config.googleDrive.folderKey],
        };
        const fileStream = new Readable();

        fileStream?.push(file.buffer);
        fileStream?.push(null);

        // Upload the file
        const { data: fileData } = await drive.files.create({
            requestBody: fileMetaData,
            media: {
                body: fileStream,
                mimeType: file?.mimetype,
            },
            fields: 'id',
        });

        // Set the file permissions to 'anyone with the link can view'
        await drive.permissions.create({
            fileId: fileData?.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Get the shareable link
        const { data: fileInfo } = await drive.files.get({
            fileId: fileData?.id,
            fields: 'webViewLink',
        });

        return {
            fileId: fileData?.id,
            shareableLink: fileInfo?.webViewLink,
            downloadLink: `https://drive.google.com/u/1/uc?id=${fileData?.id}&export=download`,
        };
    } catch (error) {
        return error;
    }
};

/**
 * Asynchronously deletes a file from Google Drive using the file's unique ID.
 *
 * This function establishes a Google Drive API client using the authorization configuration obtained from `googleDriveConfig()`.
 * It then attempts to delete the file specified by `fileId`. This is useful in applications where files stored on Google Drive
 * need to be programmatically managed, allowing for the deletion of files as part of content management or cleanup operations.
 *
 * @param {string} fileId The unique identifier of the file to be deleted on Google Drive.
 * @returns {Promise<Object>} A promise that resolves to the response from the Google Drive API upon successful deletion of the file.
 *                            In case of failure, the promise resolves to the error object caught in the catch block.
 * @throws {Error} If the function encounters an error in the deletion process, it returns the error object instead of throwing it.
 *                 This behavior is to facilitate error handling where the function is called.
 * @example
 * // Example usage of deleteFile
 * const fileId = 'your_file_id_here';
 * deleteFile(fileId)
 *   .then(response => {
 *     console.log('File deletion successful', response);
 *   })
 *   .catch(error => {
 *     console.error('Failed to delete file:', error);
 *   });
 */
const deleteFile = async fileId => {
    try {
        const authorizationClient = await googleDriveConfig();
        const drive = google.drive({
            version: 'v3',
            auth: authorizationClient,
        });

        return await drive.files.delete({ fileId });
    } catch (error) {
        return error;
    }
};

const GoogleDriveFileOperations = {
    uploadFile,
    deleteFile,
};

export default GoogleDriveFileOperations;
