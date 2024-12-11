// src/config/winstonLogger.ts
import { createLogger, format, transports } from 'winston';
import dotenv from 'dotenv';

dotenv.config();

// Define log format
const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message, stack }) => {
        return stack
            ? `${timestamp} [${level}]: ${message} - ${stack}`
            : `${timestamp} [${level}]: ${message}`;
    })
);

// Create a logger instance
const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                logFormat
            ),
        }),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' }),
    ],
});

export default logger;
