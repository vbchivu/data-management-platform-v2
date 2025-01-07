// src/app/routes/mysql/virtualDatabaseTableRoutes.ts

import express, { Router } from 'express';
import VirtualDatabaseTableController from '../../controllers/mysql/VirtualDatabaseTableController';

const router = Router({ mergeParams: true });

router.post('/', VirtualDatabaseTableController.createTable as express.RequestHandler);
router.get('/', VirtualDatabaseTableController.getAllTables as express.RequestHandler);
router.get('/:tableName', VirtualDatabaseTableController.getTableByName as express.RequestHandler);
router.delete('/:tableName', VirtualDatabaseTableController.deleteTable as express.RequestHandler);

export default router;
