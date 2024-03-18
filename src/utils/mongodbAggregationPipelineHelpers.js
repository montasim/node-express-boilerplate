const createAggregationPipeline = documentId => {
    return [
        {
            $match: { id: documentId }, // Match the permission document
        },
        {
            $lookup: {
                from: 'users',
                let: { createdByVar: '$createdBy' }, // Define variable for use in pipeline
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$id', '$$createdByVar'] },
                        },
                    }, // Use the variable to match the user
                    {
                        $project: {
                            __v: 0,
                            _id: 0,
                            id: 0,
                            role: 0,
                            password: 0,
                            isEmailVerified: 0,
                            picture: { fileId: 0, shareableLink: 0 },
                        },
                    }, // Exclude the __v, _id, id, role, password, isEmailVerified, picture field from the lookup result
                ],
                as: 'createdByUser',
            },
        },
        {
            $lookup: {
                from: 'users',
                let: { updatedByVar: '$updatedBy' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$id', '$$updatedByVar'] },
                        },
                    },
                    {
                        $project: {
                            __v: 0,
                            _id: 0,
                            id: 0,
                            role: 0,
                            password: 0,
                            isEmailVerified: 0,
                            picture: { fileId: 0, shareableLink: 0 },
                        },
                    }, // Exclude the __v, _id, id, role, password, isEmailVerified, picture field from the lookup result
                ],
                as: 'updatedByUser',
            },
        },
        {
            $unwind: {
                path: '$createdByUser',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $unwind: {
                path: '$updatedByUser',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $addFields: {
                createdBy: '$createdByUser',
                updatedBy: '$updatedByUser',
            },
        },
        {
            $project: {
                _id: 0,
                __v: 0,
                createdByUser: 0,
                updatedByUser: 0,
            },
        },
    ];
};

const mongodbAggregationPipelineHelpers = {
    createAggregationPipeline,
};

export default mongodbAggregationPipelineHelpers;
