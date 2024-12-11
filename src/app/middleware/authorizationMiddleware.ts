import { Response, NextFunction } from 'express';
import MongoPhysicalDatabase from '../models/mongo/MongoPhysicalDatabase';
import { AuthenticatedRequest } from '../../types/AuthenticatedRequest';
import MongoVirtualDatabase from '../models/mongo/MongoVirtualDatabase';
import MySQLVirtualDatabase from '../models/mysql/MySQLVirtualDatabase';
import MySQLPhysicalDatabase from '../models/mysql/MySQLPhysicalDatabase';
import logger from '../../config/winstonLogger';
import MySQLSchemaMetadata from '../models/mysql/MySQLSchemaMetadata';

/**
 * Middleware for role-based access
 */
export const authorizeRole = (requiredRole: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (req.user && req.user.role === requiredRole) {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden: Insufficient role' });
        }
    };
};

/**
 * Middleware to validate and authorize access to a database.
 * @param dbType - Type of the database ('virtual' or 'physical')
 */
export const validateAndAuthorizeDatabaseAccess = (dbType: 'virtual' | 'physical', dbChoice: 'mongo' | 'mysql') => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { dbId } = req.params;

            if (!dbId) {
                res.status(400).json({ message: 'Database ID is required.' });
                return;
            }

            if (dbChoice === 'mongo' && dbType === 'physical') {
                const mongoPhysicalDb = await MongoPhysicalDatabase.findById(dbId);
                if (!mongoPhysicalDb) {
                    res.status(404).json({ message: 'Database not found.' });
                    return;
                }

                // Check if the user is authorized to access this physical database
                if (req.user?.role !== 'admin' && String(mongoPhysicalDb.userId) !== String(req.user?._id)) {
                    res.status(403).json({ message: 'Forbidden. You do not have access to this database.' });
                    return;
                }

                req.mongoPhysicalDb = mongoPhysicalDb; // Attach the physical database object to the request
            } else if (dbChoice === 'mongo' && dbType === 'virtual') {
                const mongoVirtualDb = await MongoVirtualDatabase.findById(dbId);

                if (!mongoVirtualDb) {
                    res.status(404).json({ message: 'Database not found.' });
                    return;
                }

                // Check if the user is authorized to access this virtual database
                if (req.user?.role !== 'admin' && String(mongoVirtualDb.userId) !== String(req.user?._id)) {
                    res.status(403).json({ message: 'Forbidden. You do not have access to this database.' });
                    return;
                }

                req.mongoVirtualDb = mongoVirtualDb; // Attach the virtual database object to the request
            } else if (dbChoice === 'mysql' && dbType === 'physical') {
                console.log('MySQL Physical Database');
                // Validate access for MySQL physical databases
                const mysqlPhysicalDb = await MySQLPhysicalDatabase.findById(dbId);

                if (!mysqlPhysicalDb) {
                    res.status(404).json({ message: 'MySQL Physical Database not found.' });
                    return;
                }

                if (req.params.schemaName) {
                    // Check if the schema exists in the physical database
                    const schema = await MySQLSchemaMetadata.findOne({ databaseId: dbId, name: req.params.schemaName });
                    if (!schema) {
                        res.status(404).json({ message: 'Schema not found.' });
                        return;
                    }
                }

                // Check if the user is authorized to access this MySQL physical database
                if (req.user?.role !== 'admin' && String(mysqlPhysicalDb.userId) !== String(req.user?._id)) {
                    res.status(403).json({ message: 'Forbidden. You do not have access to this database.' });
                    return;
                }

                req.mysqlPhysicalDb = mysqlPhysicalDb; // Attach the MySQL physical database object to the request
            } else if (dbChoice === 'mysql' && dbType === 'virtual') {
                // Validate access for MySQL virtual databases
                const mysqlVirtualDb = await MySQLVirtualDatabase.findById(dbId);
                if (!mysqlVirtualDb) {
                    res.status(404).json({ message: 'MySQL Virtual Database not found.' });
                    return;
                }

                // Check if the user is authorized to access this MySQL virtual database
                if (req.user?.role !== 'admin' && String(mysqlVirtualDb.userId) !== String(req.user?._id)) {
                    res.status(403).json({ message: 'Forbidden. You do not have access to this database.' });
                    return;
                }

                req.mysqlVirtualDb = mysqlVirtualDb; // Attach the MySQL virtual database object to the request
            } else {
                res.status(400).json({ message: 'Invalid database type.' });
                return;
            }

            next();
        } catch (error) {
            logger.error(`Error in validateAndAuthorizeDatabaseAccess middleware: ${error}`);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};