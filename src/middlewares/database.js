import mongoose from 'mongoose';

import config from '../config/config.js';

const connect = async () => {
    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(config.mongoose.url);

        console.log('🚀 Database connected successfully');
    }
};

const disconnect = async (req, res, next) => {
    await mongoose.disconnect();

    console.log('🚫 Database connection closed successfully.');

    if (next) {
        next();
    }
};

const Database = {
    connect,
    disconnect,
};

export default Database;
