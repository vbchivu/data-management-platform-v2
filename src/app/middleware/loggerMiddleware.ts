// src/app/middleware/loggerMiddleware.ts
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import logger from '../../config/winstonLogger';

// Create a write stream for access logs
const accessLogStream = fs.createWriteStream(path.join(__dirname, '../../../logs/access.log'), { flags: 'a' });

// Morgan middleware setup for logging HTTP requests
const morganMiddleware = morgan('combined', {
    stream: accessLogStream,
    skip: (req, res) => process.env.NODE_ENV === 'development' && res.statusCode < 400, // Skip successful requests in development
});

// Custom middleware to use Winston for logging
const winstonLoggerMiddleware = (req: { method: any; url: any; }, res: { statusCode: any; }, next: () => void) => {
    logger.info(`${req.method} ${req.url} - Status: ${res.statusCode}`);
    next();
};

export { morganMiddleware, winstonLoggerMiddleware };
