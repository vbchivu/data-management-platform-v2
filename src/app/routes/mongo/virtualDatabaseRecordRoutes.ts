import express, { Router } from 'express';
import VirtualDatabaseRecordController from '../../controllers/mongo/VirtualDatabaseRecordController';

const router = Router({ mergeParams: true });

router.post('/', VirtualDatabaseRecordController.createRecord as express.RequestHandler);
router.get('/', VirtualDatabaseRecordController.getAllRecords as express.RequestHandler);
router.get('/:recId', VirtualDatabaseRecordController.getRecordById as express.RequestHandler);
router.put('/:recId', VirtualDatabaseRecordController.updateRecord as express.RequestHandler);
router.delete('/:recId', VirtualDatabaseRecordController.deleteRecord as express.RequestHandler);

export default router;
