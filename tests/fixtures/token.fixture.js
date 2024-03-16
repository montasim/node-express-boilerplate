import moment from 'moment';
import config from '../../src/config/config.js';
import { tokenTypes } from '../../src/config/tokens.js';
import tokenService from '../../src/modules/token/token.service.js';
import { userOne, admin } from './user.fixture.js';

const accessTokenExpires = moment().add(
    config.jwt.accessExpirationMinutes,
    'minutes'
);
const userOneAccessToken = tokenService.generateToken(
    userOne._id,
    accessTokenExpires,
    tokenTypes.ACCESS
);
const adminAccessToken = tokenService.generateToken(
    admin._id,
    accessTokenExpires,
    tokenTypes.ACCESS
);

export { userOneAccessToken, adminAccessToken };
