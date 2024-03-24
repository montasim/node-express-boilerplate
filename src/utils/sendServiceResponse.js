/**
 * @fileoverview Service Response Standardization Utility for Node.js Applications.
 *
 * This utility module offers a function that streamlines the creation of response objects across various
 * parts of an application or service, promoting consistency in how responses are structured and delivered
 * to clients or end-users. By defining a uniform response format, the function aids in maintaining clarity
 * and predictability in API or service communication, enhancing the overall integration and user experience.
 *
 * The function, `sendServiceResponse`, constructs a response object encapsulating essential information:
 * - `success`: A boolean flag indicating the successful execution of the requested operation.
 * - `statusCode`: An HTTP status code that succinctly represents the result of the operation, facilitating
 *   standard web protocol compliance and interoperability.
 * - `message`: A human-readable message providing context or details about the operation's outcome, aiding
 *   in debugging and user support.
 * - `data`: An optional payload containing the data resulting from the operation, structured as an object.
 *   This part of the response is flexible to accommodate various types of information, from entity details
 *   to complex datasets.
 *
 * Intended for broad use across backend services, controllers, and handlers, this function ensures that
 * all responses follow a consistent format, simplifying both the development process and the client-side
 * handling of server responses.
 */

/**
 * Constructs a standardized response object for service or API responses. This function is useful for
 * ensuring consistency across different parts of the application or service by standardizing the format
 * of the responses sent back to clients or callers. The response object includes a success flag, an HTTP
 * status code, a descriptive message, and the payload (data) associated with the response.
 *
 * @param {number} statusCode The HTTP status code associated with the response, indicating the outcome
 *                            of the requested operation.
 * @param {string} message A descriptive message providing additional information about the response or
 *                         the outcome of the requested operation.
 * @param {Object} [data={}] The payload of the response, containing any data that needs to be sent back
 *                           to the client. Defaults to an empty object if no data is provided.
 * @returns {Object} A standardized response object containing the success status, HTTP status code,
 *                   message, and data payload.
 * @example
 * // Example of sending a successful response with user data
 * const response = sendServiceResponse(200, 'User fetched successfully', { id: 1, name: 'John Doe' });
 * console.log(response);
 * // Output: {
 * //   success: true,
 * //   statusCode: 200,
 * //   message: 'User fetched successfully',
 * * //  data: { id: 1, name: 'John Doe' }
 * // }
 */
const sendServiceResponse = (statusCode, message, data) => {
    return {
        success: true,
        statusCode: statusCode,
        message: message,
        data: data,
    };
};

export default sendServiceResponse;
