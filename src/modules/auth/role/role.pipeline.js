const getRoles = (matchStage, sortStage, skip, limit) =>
    [
        matchStage,
        {
            $lookup: {
                from: 'users',
                let: { createdByVar: '$createdBy' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$id', '$$createdByVar'] },
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
            $lookup: {
                from: 'permissions',
                let: { permissionsVar: '$permissions.permission' }, // Assuming permissions are stored as an array of objects with { permission: "permId" }
                pipeline: [
                    {
                        $match: {
                            $expr: { $in: ['$id', '$$permissionsVar'] },
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            let: { createdByVar: '$createdBy' }, // Define variable for use in pipeline
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$id', '$$createdByVar'],
                                        },
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
                                        picture: {
                                            fileId: 0,
                                            shareableLink: 0,
                                        },
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
                                        $expr: {
                                            $eq: ['$id', '$$updatedByVar'],
                                        },
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
                                        picture: {
                                            fileId: 0,
                                            shareableLink: 0,
                                        },
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
                            password: 0,
                            createdByUser: 0,
                            updatedByUser: 0,
                            picture: {
                                fileId: 0,
                                shareableLink: 0,
                            },
                        },
                    },
                ],
                as: 'permissions',
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
        sortStage,
        { $skip: skip },
        { $limit: limit },
        {
            $project: {
                _id: 0,
                __v: 0,
                createdByUser: 0,
                updatedByUser: 0,
            },
        },
    ].filter(stage => Object.keys(stage).length);

const getRole = documentId => [
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
        $lookup: {
            from: 'permissions',
            let: { permissionsVar: '$permissions.permission' }, // Assuming permissions are stored as an array of objects with { permission: "permId" }
            pipeline: [
                {
                    $match: {
                        $expr: { $in: ['$id', '$$permissionsVar'] },
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        let: { createdByVar: '$createdBy' }, // Define variable for use in pipeline
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$id', '$$createdByVar'],
                                    },
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
                                    picture: {
                                        fileId: 0,
                                        shareableLink: 0,
                                    },
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
                                    $expr: {
                                        $eq: ['$id', '$$updatedByVar'],
                                    },
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
                                    picture: {
                                        fileId: 0,
                                        shareableLink: 0,
                                    },
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
                        password: 0,
                        createdByUser: 0,
                        updatedByUser: 0,
                        picture: {
                            fileId: 0,
                            shareableLink: 0,
                        },
                    },
                },
            ],
            as: 'permissions',
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
            password: 0,
            createdByUser: 0,
            updatedByUser: 0,
            picture: {
                fileId: 0,
                shareableLink: 0,
            },
        },
    },
];

const RoleAggregationPipeline = {
    getRoles,
    getRole,
};

export default RoleAggregationPipeline;
