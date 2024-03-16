import config from '../config/config.js';

const corsConfiguration = {
    origin: config.cors.origin,
    methods: config.cors.methods,
    credentials: true, // If you need to support cookies or authentication
};

export default corsConfiguration;
