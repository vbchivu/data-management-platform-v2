import { Request, Response, NextFunction, RequestHandler } from 'express';

// Declare global modifications for the Express Request object
declare global {
    namespace Express {
        interface Request {
            dbType?: 'virtual' | 'physical';
        }
    }
}

/**
 * Middleware to determine if the request is for a virtual or physical database.
 * Sets the `req.dbType` based on the URL path.
 */
const determineDatabaseType: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    // Use the URL to determine if it's for 'virtual' or 'physical' databases
    if (req.path.startsWith('/virtual')) {
        req.dbType = 'virtual';
    } else if (req.path.startsWith('/physical')) {
        req.dbType = 'physical';
    } else {
        res.status(400).json({ message: 'Invalid database type in URL.' });
        return;
    }

    next();
};

export default determineDatabaseType;
