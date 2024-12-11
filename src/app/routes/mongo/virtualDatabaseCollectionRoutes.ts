import express, { Router } from 'express';
import VirtualDatabaseCollectionController from '../../controllers/mongo/VirtualDatabaseCollectionController';

const router = Router({ mergeParams: true });

router.post('/', VirtualDatabaseCollectionController.createCollection as express.RequestHandler);
router.get('/', VirtualDatabaseCollectionController.getAllCollections as express.RequestHandler);
router.get('/:colId', VirtualDatabaseCollectionController.getCollectionById as express.RequestHandler);
router.delete('/:colId', VirtualDatabaseCollectionController.deleteCollection as express.RequestHandler);

export default router;
