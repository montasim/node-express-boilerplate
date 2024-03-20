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

const UserAggregationPipeline = {
    getUser,
};

export default UserAggregationPipeline;
