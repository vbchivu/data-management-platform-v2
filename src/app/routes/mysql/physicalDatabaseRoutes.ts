import express, { Router } from 'express';
import PhysicalDatabaseController from '../../controllers/mysql/PhysicalDatabaseController';
import asyncMiddleware from '../../middleware/asyncMiddleware';
import { validateAndAuthorizeDatabaseAccess } from '../../middleware/authorizationMiddleware';

const router = Router({ mergeParams: true });

// Create a new MySQL database (No need to validate database access here)
router.post('/', PhysicalDatabaseController.createDatabase as express.RequestHandler);

// Get all MySQL databases (No need to validate specific database access here)
router.get('/', PhysicalDatabaseController.getAllDatabases as express.RequestHandler);

// Get a specific MySQL database by ID (with authorization check)
router.get(
    '/:dbId',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('physical', 'mysql')),
    PhysicalDatabaseController.getDatabase as express.RequestHandler
);

// Create a new MySQL schema in a specific database (with authorization check)
router.post(
    '/:dbId/schemas',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('physical', 'mysql')),
    PhysicalDatabaseController.createNewSchema as express.RequestHandler
);

// Delete a specific MySQL schema in a specific database (with authorization check)
router.delete(
    '/:dbId/schemas/:schemaName',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('physical', 'mysql')),
    PhysicalDatabaseController.deleteSchema as express.RequestHandler
);

// Delete a specific MySQL database by ID (with authorization check)
router.delete(
    '/:dbId',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('physical', 'mysql')),
    PhysicalDatabaseController.deleteDatabase as express.RequestHandler
);

export default router;
