// src/app/routes/mysql/virtualDatabaseRoutes.ts

import express, { Router } from 'express';
import VirtualDatabaseController from '../../controllers/mysql/VirtualDatabaseController';
import asyncMiddleware from '../../middleware/asyncMiddleware';
import { validateAndAuthorizeDatabaseAccess } from '../../middleware/authorizationMiddleware';

const router = Router({ mergeParams: true });

// Create a new MySQL database (No need to validate database access here)
router.post('/', VirtualDatabaseController.createDatabase as express.RequestHandler);

// Get all MySQL databases (No need to validate specific database access here)
router.get('/', VirtualDatabaseController.getAllDatabases as express.RequestHandler);

// Get a specific MySQL database by ID (with authorization check)
router.get(
    '/:dbId',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('virtual', 'mysql')),
    VirtualDatabaseController.getDatabase as express.RequestHandler
);

// Delete a specific MySQL database by ID (with authorization check)
router.delete(
    '/:dbId',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('virtual', 'mysql')),
    VirtualDatabaseController.deleteDatabase as express.RequestHandler
);

export default router;
