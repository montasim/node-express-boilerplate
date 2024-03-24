/**
 * @fileoverview Controller Success Response Sender for Express.js Applications.
 *
 * This module introduces a streamlined mechanism for sending success responses from controllers in Express.js
 * applications. By encapsulating the process of formatting and transmitting response objects, it ensures a
 * uniform response structure and simplifies the controller logic, thereby enhancing code readability and
 * maintainability. The function caters to the common need for indicating operation success, conveying status
 * codes, and transmitting data or messages back to the client in a consistent manner.
 *
 * The `sendControllerSuccessResponse` function accepts the Express.js response object and a successData object,
 * which includes:
 * - `success`: A boolean flag indicating the successful completion of the requested operation.
 * - `statusCode`: An HTTP status code that succinctly represents the success of the operation, aiding in compliance
 *   with web standards and client-side handling.
 * - `message`: A descriptive message that provides additional context about the operation's success, useful for
 *   logging, debugging, and user feedback.
 * - `data`: An optional payload containing the data generated or affected by the operation, structured to be easily
 *   consumable by the client.
 *
 * Designed for use across various controllers within an Express.js application, this utility function promotes a
 * consistent and intuitive API design, improving the developer experience and facilitating the implementation of
 * best practices in API development and client-server communication.
 */

/**
 * Sends a standardized success response to the client from a controller. This function abstracts the
 * details of constructing the response object and setting the HTTP status code, facilitating a consistent
 * response structure across different parts of the application. The response object can include a success
 * flag, HTTP status code, a descriptive message, and any relevant data payload.
 *
 * @param {Object} res The response object provided by Express.js, used to send the response to the client.
 * @param {Object} successData An object containing the data for the success response, including:
 *                             - `success`: A boolean indicating the operation was successful.
 *                             - `statusCode`: The HTTP status code associated with the success response.
 *                             - `message`: A descriptive message about the success.
 *                             - `data`: The payload containing any data to be returned to the client.
 * @example
 * // Example of sending a success response from a controller
 * const userData = {
 *   success: true,
 *   statusCode: 200,
 *   message: 'User data retrieved successfully',
 *   data: { id: 1, name: 'Jane Doe' }
 * };
 * sendControllerSuccessResponse(res, userData);
 * // This will send a response with status 200 and the included user data.
 */
const sendControllerSuccessResponse = (res, successData) => {
    const errorResponse = {
        success: successData?.success,
        statusCode: successData?.statusCode,
        message: successData?.message,
        data: successData?.data,
    };

    res.status(errorResponse.statusCode).json(errorResponse);
};

export default sendControllerSuccessResponse;
