import catchAsync from '../../utils/catchAsync.js';
import indexService from './index.service.js';

const indexController = catchAsync(async (req, res) => {
    const indexData = indexService();

    res.status(indexData.status).send(indexData);
});

export default indexController;
