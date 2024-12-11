import express, { Router } from 'express';
import VirtualDatabaseRecordController from '../../controllers/mysql/VirtualDatabaseRecordController';

const router = Router({ mergeParams: true });

router.post('/', VirtualDatabaseRecordController.createRecord as express.RequestHandler);
router.get('/', VirtualDatabaseRecordController.getAllRecords as express.RequestHandler);
router.get('/:recordId', VirtualDatabaseRecordController.getRecord as express.RequestHandler);
router.put('/:recordId', VirtualDatabaseRecordController.updateRecord as express.RequestHandler);
router.delete('/:recordId', VirtualDatabaseRecordController.deleteRecord as express.RequestHandler);

export default router;
