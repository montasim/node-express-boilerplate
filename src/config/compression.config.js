import compression from 'compression';

const compressionConfig = compression({
    level: 9, // Maximum compression level
    threshold: 0, // Always compress, regardless of response size
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            // Do not compress responses if the 'x-no-compression' header is present
            return false;
        }

        // Always compress when the 'x-no-compression' header is not present
        return compression.filter(req, res);
    },
});

export default compressionConfig;
