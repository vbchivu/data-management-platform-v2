import express, { Router } from 'express';
import PhysicalDatabaseRecordController from '../../controllers/mysql/PhysicalDatabaseRecordController';

const router = Router({ mergeParams: true });

router.post('/', PhysicalDatabaseRecordController.createRecord as express.RequestHandler);
router.get('/', PhysicalDatabaseRecordController.getAllRecords as express.RequestHandler);
router.get('/:recordId', PhysicalDatabaseRecordController.getRecord as express.RequestHandler);
router.put('/:recordId', PhysicalDatabaseRecordController.updateRecord as express.RequestHandler);
router.delete('/:recordId', PhysicalDatabaseRecordController.deleteRecord as express.RequestHandler);

export default router;
