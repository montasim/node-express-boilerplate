import winston from 'winston';
import { fileURLToPath } from 'url';
import path from 'path';

import createFolderIfNotExists from '../utils/createFolderIfNotExists.js';

import config from './config.js';

// Derive the equivalent of __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Now you can correctly resolve the log directory path
const logsDirectory = path.resolve(__dirname, '../../tmp/logs');

await createFolderIfNotExists(logsDirectory);

const enumerateErrorFormat = winston.format(info => {
    if (info instanceof Error) {
        Object.assign(info, { message: info.stack });
    }
    return info;
});

// Custom log format
const logFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
        ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`
    )
);

// Only apply colorizing in development
const developmentFormat = winston.format.combine(
    enumerateErrorFormat(),
    winston.format.colorize(),
    logFormat
);

const productionFormat = winston.format.combine(
    enumerateErrorFormat(),
    winston.format.uncolorize(),
    logFormat
);

let logger;

if (config.env === 'development') {
    logger = winston.createLogger({
        level: config.env === 'development' ? 'debug' : 'info',
        format:
            config.env === 'development' ? developmentFormat : productionFormat,
        transports: [
            new winston.transports.Console({
                stderrLevels: ['error'],
            }),
            // File transports from logger1.js
            new winston.transports.File({
                filename: path.join(logsDirectory, 'error.log'),
                level: 'error',
            }),
            new winston.transports.File({
                filename: path.join(logsDirectory, 'warn.log'),
                level: 'warn',
            }),
            new winston.transports.File({
                filename: path.join(logsDirectory, 'info.log'),
                level: 'info',
            }),
            new winston.transports.File({
                filename: path.join(logsDirectory, 'http.log'),
                level: 'http',
            }),
            new winston.transports.File({
                filename: path.join(logsDirectory, 'verbose.log'),
                level: 'verbose',
            }),
            new winston.transports.File({
                filename: path.join(logsDirectory, 'debug.log'),
                level: 'debug',
            }),
            new winston.transports.File({
                filename: path.join(logsDirectory, 'combined.log'),
            }),
        ],
    });
}

export default logger;
