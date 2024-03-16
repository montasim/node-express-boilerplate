import fetchClientDeviceDetails from './fetchClientDeviceDetails.js';
import deriveNavigationLinks from './deriveNavigationLinks.js';
import determineCacheStatus from './determineCacheStatus.js';

const fetchRequestMetadata = async (req) => {
    const device = await fetchClientDeviceDetails(req);
    const links = await deriveNavigationLinks(req);
    const meta = await determineCacheStatus(req);
    const ifNoneMatch = req.headers['if-none-match'];
    const ifModifiedSince = req.headers['if-modified-since'];

    return {
        device,
        links,
        meta,
        ifNoneMatch,
        ifModifiedSince
    };
};

export default fetchRequestMetadata;
