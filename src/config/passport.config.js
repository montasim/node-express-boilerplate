import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

import config from './config.js';
import tokenTypes from './tokens.config.js';
import UserModel from '../modules/user/user.model.js';

const jwtOptions = {
    secretOrKey: config.jwt.secret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
    try {
        if (payload?.type !== tokenTypes.ACCESS) {
            throw new Error('Invalid token type');
        }

        // Find the user by ID
        const user = await UserModel.findOne({ id: payload?.sub });

        if (!user) {
            return done(null, false);
        }

        done(null, user);
    } catch (error) {
        done(error, false);
    }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

export default jwtStrategy;
