// src/app/routes/mysql/mysqlDatabaseRoutes.ts

import { Router } from 'express';
import physicalDatabaseRoutes from './physicalDatabaseRoutes';
import physicalDatabaseTableRoutes from './physicalDatabaseTableRoutes';
import physicalDatabaseRecordRoutes from './physicalDatabaseRecordRoutes';
import virtualDatabaseRoutes from './virtualDatabaseRoutes';
import virtualDatabaseTableRoutes from './virtualDatabaseTableRoutes';
import virtualDatabaseRecordRoutes from './virtualDatabaseRecordRoutes';
import asyncMiddleware from '../../middleware/asyncMiddleware';
import { validateAndAuthorizeDatabaseAccess } from '../../middleware/authorizationMiddleware';

const mysqlDatabaseRoutes = Router();

mysqlDatabaseRoutes.use(
    '/physical/databases/:dbId/schemas/:schemaName/tables/:tableName/records',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('physical', 'mysql')),
    physicalDatabaseRecordRoutes
);
mysqlDatabaseRoutes.use(
    '/physical/databases/:dbId/schemas/:schemaName/tables',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('physical', 'mysql')),
    physicalDatabaseTableRoutes
);
mysqlDatabaseRoutes.use('/physical/databases', physicalDatabaseRoutes);

mysqlDatabaseRoutes.use(
    '/virtual/databases/:dbId/tables/:tableName/records',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('virtual', 'mysql')),
    virtualDatabaseRecordRoutes
);
mysqlDatabaseRoutes.use(
    '/virtual/databases/:dbId/tables',
    asyncMiddleware(validateAndAuthorizeDatabaseAccess('virtual', 'mysql')),
    virtualDatabaseTableRoutes
);
mysqlDatabaseRoutes.use('/virtual/databases', virtualDatabaseRoutes);
export default mysqlDatabaseRoutes;
