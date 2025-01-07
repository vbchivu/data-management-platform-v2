// src/app/routes/mongo/physicalDatabaseRoutes.ts

import express, { Router } from 'express';
import PhysicalDatabaseController from '../../controllers/mongo/PhysicalDatabaseController';
import { validateAndAuthorizeDatabaseAccess } from '../../middleware/authorizationMiddleware';
import asyncMiddleware from '../../middleware/asyncMiddleware';

const router = Router();

router.post('/', PhysicalDatabaseController.createDatabase as express.RequestHandler);
router.get('/', PhysicalDatabaseController.getAllDatabases as express.RequestHandler);
router.get('/:dbId',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('physical', 'mongo')),
    PhysicalDatabaseController.getDatabaseById as express.RequestHandler
);
router.delete('/:dbId',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('physical', 'mongo')),
    PhysicalDatabaseController.deleteDatabase as express.RequestHandler
);

export default router;
