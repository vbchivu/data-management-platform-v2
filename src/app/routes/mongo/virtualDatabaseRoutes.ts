// src/app/routes/mongo/virtualDatabaseRoutes.ts

import express, { Router } from 'express';
import VirtualDatabaseController from '../../controllers/mongo/VirtualDatabaseController';
import { validateAndAuthorizeDatabaseAccess } from '../../middleware/authorizationMiddleware';
import asyncMiddleware from '../../middleware/asyncMiddleware';

const router = Router();

router.post('/', VirtualDatabaseController.createDatabase as express.RequestHandler);
router.get('/', VirtualDatabaseController.getAllDatabases as express.RequestHandler);
router.get('/:dbId',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('virtual', 'mongo')),
    VirtualDatabaseController.getDatabaseById as express.RequestHandler
);
router.delete('/:dbId',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('virtual', 'mongo')),
    VirtualDatabaseController.deleteDatabase as express.RequestHandler
);

export default router;
