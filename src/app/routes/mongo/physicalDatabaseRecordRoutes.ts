// src/app/routes/mongo/physicalDatabaseRecordRoutes.ts

import express, { Router } from 'express';
import PhysicalDatabaseRecordController from '../../controllers/mongo/PhysicalDatabaseRecordController';

const router = Router({ mergeParams: true });

router.post('/', PhysicalDatabaseRecordController.createRecord as express.RequestHandler);
router.get('/', PhysicalDatabaseRecordController.getAllRecords as express.RequestHandler);
router.get('/:recId', PhysicalDatabaseRecordController.getRecordById as express.RequestHandler);
router.put('/:recId', PhysicalDatabaseRecordController.updateRecord as express.RequestHandler);
router.delete('/:recId', PhysicalDatabaseRecordController.deleteRecord as express.RequestHandler);

export default router;
