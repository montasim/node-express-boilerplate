/**
 * @fileoverview User Data Aggregation Pipeline Module for MongoDB.
 *
 * This module provides a set of MongoDB aggregation pipeline configurations designed specifically for
 * enhancing the retrieval and manipulation of user data within a Node.js application utilizing MongoDB
 * as the database. It includes advanced query capabilities that go beyond basic CRUD operations, enabling
 * complex data transformations, joins, and projections to fulfill the requirements of diverse application
 * features and data presentation needs.
 *
 * The aggregation pipelines defined in this module facilitate the integration of related data from different
 * collections (such as roles and user audit information) directly into user documents. This approach greatly
 * simplifies the process of fetching comprehensive user profiles, roles, and related metadata in a single
 * database operation, thereby improving performance and data consistency.
 *
 * Key Features:
 * - Detailed user profile retrieval, including role information and user creation and update metadata, through
 *   a well-structured aggregation pipeline that joins related collections.
 * - Customizable projection of result sets to exclude sensitive or unnecessary fields from the output, enhancing
 *   security and response efficiency.
 * - Modular function design allowing for easy extension with additional aggregation pipelines as needed to
 *   address specific use cases or application growth.
 *
 * This module exemplifies the powerful data aggregation capabilities of MongoDB, offering a robust solution for
 * managing complex data relationships and retrieval requirements within user management functionalities of
 * Node.js applications.
 */

/**
 * Defines an aggregation pipeline for retrieving a user document from the database, including
 * detailed information by joining with the `roles`, `createdBy`, and `updatedBy` references.
 * This function constructs the pipeline steps necessary to perform these operations, tailored
 * to a specific user document identified by a custom ID.
 *
 * The pipeline:
 * 1. Matches the user document based on a provided custom ID.
 * 2. Perform a lookup (join) with the `roles` collection to populate the user's role.
 * 3. Unwinds the `role` field to transform it from an array to a single document (or keeps it
 *    empty if no role is associated).
 * 4. It looks up the `createdBy` and `updatedBy` fields in the `users` collection to populate
 *    these fields with the respective user documents.
 * 5. Projects the final document, excluding sensitive or unnecessary fields like `_id`, `__v`,
 *    and `password`, and optionally other fields from populated documents.
 *
 * This approach allows for the retrieval of comprehensive user information in a single query,
 * optimizing performance and reducing the need for multiple database calls.
 *
 * @param {string} documentId The custom ID of the user document to retrieve.
 * @returns {Array<Object>} An array of aggregation pipeline stages configured to retrieve and
 *                          populate the specified user document.
 */
const getUser = documentId => [
    {
        $match: {
            id: documentId, // Matching the user by their custom ID
        },
    },
    {
        $lookup: {
            from: 'roles', // "roles" is the collection name for roles
            localField: 'role',
            foreignField: 'id',
            as: 'role',
        },
    },
    {
        $unwind: {
            path: '$role',
            preserveNullAndEmptyArrays: true,
        },
    },
    {
        $lookup: {
            from: 'users', // Assuming 'users' is the collection name for both createdBy and updatedBy
            localField: 'createdBy',
            foreignField: 'id',
            as: 'createdBy',
        },
    },
    {
        $lookup: {
            from: 'users',
            localField: 'updatedBy',
            foreignField: 'id',
            as: 'updatedBy',
        },
    },
    {
        $project: {
            _id: 0,
            __v: 0,
            password: 0, // Assuming you don't want to return these fields
            // Adjust the fields here based on what you want to exclude or include
            // For example, to not include some fields from populated documents:
            'role._id': 0,
            'role.__v': 0,
        },
    },
];

/**
 * A collection of MongoDB aggregation pipeline functions for the User model. These pipelines are
 * designed to retrieve and manipulate user data in complex ways that go beyond simple CRUD operations,
 * allowing for the integration of data from multiple collections and the application of advanced
 * data processing and filtering logic.
 *
 * Each function within this collection returns an array of aggregation pipeline stages, tailored
 * to perform specific tasks related to user data, such as enriching user documents with additional
 * information from related collections or applying complex filters and transformations.
 *
 * Currently available pipeline functions:
 * - `getUser`: Retrieves a detailed user document, including populated role and creator/updater
 *   information, based on a given user ID. It carefully constructs the aggregation steps to match,
 *   join, and project the necessary user data, excluding sensitive fields like passwords.
 *
 * This modular approach allows for the easy extension of the pipeline collection with additional
 * functions as needed to address specific data aggregation requirements.
 *
 * @example
 * // Use the getUser pipeline function to retrieve a user with populated role and creator details
 * const pipeline = UserAggregationPipeline.getUser('userId123');
 * UserModel.aggregate(pipeline).then(result => {
 *   console.log(result);
 * });
 */
const UserAggregationPipeline = {
    getUser,
};

export default UserAggregationPipeline;
