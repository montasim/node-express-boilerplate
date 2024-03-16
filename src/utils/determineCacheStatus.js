const determineCacheStatus = async req => {
    const ifNoneMatch = req.headers['if-none-match'];
    const ifModifiedSince = req.headers['if-modified-since'];

    return {
        cache: ifNoneMatch || ifModifiedSince ? 'Cache' : 'No-Cache',
    };
};

export default determineCacheStatus;
