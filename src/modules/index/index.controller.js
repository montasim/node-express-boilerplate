import asyncErrorHandler from '../../utils/asyncErrorHandler.js';
import indexService from './index.service.js';

const indexController = asyncErrorHandler(async (req, res) => {
    const indexData = indexService();

    res.status(indexData.status).send(indexData);
});

export default indexController;
