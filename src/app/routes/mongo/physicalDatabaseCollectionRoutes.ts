import express, { Router } from 'express';
import PhysicalDatabaseCollectionController from '../../controllers/mongo/PhysicalDatabaseCollectionController';

const router = Router({ mergeParams: true });

router.post('/', PhysicalDatabaseCollectionController.createCollection as express.RequestHandler);
router.get('/', PhysicalDatabaseCollectionController.getAllCollections as express.RequestHandler);
router.get('/:colId', PhysicalDatabaseCollectionController.getCollectionById as express.RequestHandler);
router.delete('/:colId', PhysicalDatabaseCollectionController.deleteCollection as express.RequestHandler);

export default router;
