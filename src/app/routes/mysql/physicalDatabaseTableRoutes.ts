// src/app/routes/mysql/physicalDatabaseTableRoutes.ts

import express, { Router } from 'express';
import PhysicalDatabaseTableController from '../../controllers/mysql/PhysicalDatabaseTableController';

const router = Router({ mergeParams: true });

router.post('/', PhysicalDatabaseTableController.createTable as express.RequestHandler);
router.get('/', PhysicalDatabaseTableController.getAllTables as express.RequestHandler);
router.get('/:tableName', PhysicalDatabaseTableController.getTableByName as express.RequestHandler);
router.delete('/:tableName', PhysicalDatabaseTableController.deleteTable as express.RequestHandler);

export default router;
