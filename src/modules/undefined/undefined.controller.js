import catchAsync from '../../utils/catchAsync.js';
import undefinedService from './undefined.service.js';

const UndefinedController = catchAsync(async (req, res) => {
    const undefinedData = undefinedService();

    res.status(undefinedData.status).send(undefinedData);
});
export default UndefinedController;
