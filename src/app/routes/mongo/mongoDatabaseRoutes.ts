// src/app/routes/mongo/mongoDatabaseRoutes.ts

import { Router } from 'express';
import physicalDatabaseRoutes from './physicalDatabaseRoutes';
import virtualDatabaseRoutes from './virtualDatabaseRoutes';
import physicalDatabaseCollectionRoutes from './physicalDatabaseCollectionRoutes';
import virtualDatabaseCollectionRoutes from './virtualDatabaseCollectionRoutes';
import physicalDatabaseRecordRoutes from './physicalDatabaseRecordRoutes';
import virtualDatabaseRecordRoutes from './virtualDatabaseRecordRoutes';
import { validateAndAuthorizeDatabaseAccess } from '../../middleware/authorizationMiddleware';
import asyncMiddleware from '../../middleware/asyncMiddleware';

const mongoDatabaseRoutes = Router();

// Virtual Database routes
mongoDatabaseRoutes.use(
    '/virtual/databases/:dbId/collections/:colId/records',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('virtual', 'mongo')),
    virtualDatabaseRecordRoutes
);
mongoDatabaseRoutes.use(
    '/virtual/databases/:dbId/collections',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('virtual', 'mongo')),
    virtualDatabaseCollectionRoutes
);
mongoDatabaseRoutes.use('/virtual/databases', virtualDatabaseRoutes);

// Physical Database routes
mongoDatabaseRoutes.use(
    '/physical/databases/:dbId/collections/:colId/records',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('physical', 'mongo')),
    physicalDatabaseRecordRoutes
);
mongoDatabaseRoutes.use(
    '/physical/databases/:dbId/collections',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('physical', 'mongo')),
    physicalDatabaseCollectionRoutes
);
mongoDatabaseRoutes.use('/physical/databases', physicalDatabaseRoutes);

export default mongoDatabaseRoutes;
