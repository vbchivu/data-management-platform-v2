import { Response } from 'express';
import PhysicalDatabaseCollectionService from '../../services/mongo/PhysicalDatabaseCollectionService';
import { AuthenticatedRequest } from '@src/types/AuthenticatedRequest';

class PhysicalDatabaseCollectionController {
    // Create a new collection in a physical database
    static async createCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { collectionName, fields, useValidator } = req.body;

        if (!collectionName || !fields) {
            res.status(400).json({ message: 'Collection name and fields are required' });
            return;
        }

        if (!req.mongoPhysicalDb) {
            res.status(500).json({ message: 'Physical database not found' });
            return;
        }

        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        try {
            // Call the service to create the collection
            const newCollection = await PhysicalDatabaseCollectionService.createCollection(
                req.user,
                req.mongoPhysicalDb,
                collectionName,
                fields,
                useValidator
            );

            res.status(201).json({ message: 'Collection created successfully', collectionId: newCollection._id });
        } catch (error: any) {
            res.status(500).json({ message: 'Error creating collection', error: error.message });
        }
    }

    // Get all collections in a physical database
    static async getAllCollections(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.mongoPhysicalDb) {
            res.status(500).json({ message: 'Physical database not found' });
            return;
        }

        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        try {
            const collections = await PhysicalDatabaseCollectionService.getAllCollections(req.mongoPhysicalDb);
            res.status(200).json({ collections });
        } catch (error: any) {
            res.status(500).json({ message: 'Error retrieving collections', error: error.message });
        }
    }

    // Get a specific collection by ID from a physical database
    static async getCollectionById(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { colId } = req.params;

        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!colId) {
            res.status(400).json({ message: 'Collection ID is required' });
            return;
        }

        if (!req.mongoPhysicalDb) {
            res.status(500).json({ message: 'Physical database not found' });
            return;
        }

        try {
            const collection = await PhysicalDatabaseCollectionService.getCollectionById(req.mongoPhysicalDb, colId, req.user);

            if (!collection) {
                res.status(404).json({ message: 'Collection not found' });
                return;
            }

            res.status(200).json({ collection });
        } catch (error: any) {
            res.status(500).json({ message: 'Error retrieving collection', error: error.message });
        }
    }

    // Delete a specific collection by ID from a physical database
    static async deleteCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { colId } = req.params;

        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!colId) {
            res.status(400).json({ message: 'Collection ID is required' });
            return;
        }

        if (!req.mongoPhysicalDb) {
            res.status(500).json({ message: 'Physical database not found' });
            return;
        }

        try {
            await PhysicalDatabaseCollectionService.deleteCollection(req.mongoPhysicalDb, colId, req.user);
            res.status(200).json({ message: 'Collection deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting collection', error: error.message });
        }
    }
}

export default PhysicalDatabaseCollectionController;
