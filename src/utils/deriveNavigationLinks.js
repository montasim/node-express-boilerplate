const deriveNavigationLinks = async (req) => {
    const protocol = req.protocol; // 'http' or 'https'

    return {
        self: `${protocol}://${req.headers.host}${req.originalUrl}`,
        src: req.headers['referer'] || 'Direct Access', // Referer (URL from where the request was made)
    };
};

export default deriveNavigationLinks;
