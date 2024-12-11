import { Request, Response } from 'express';
import VirtualDatabaseCollectionService from '../../services/mongo/VirtualDatabaseCollectionService';

class VirtualCollectionController {
    // Create a new collection in a virtual database
    static async createCollection(req: Request, res: Response): Promise<void> {
        const { dbId } = req.params;
        const { collectionName, fields, useValidator } = req.body;

        if (!collectionName || !fields) {
            res.status(400).json({ message: 'Collection name and fields are required' });
            return;
        }

        try {
            const newCollection = await VirtualDatabaseCollectionService.createCollection(
                dbId,
                collectionName,
                fields,
                useValidator,
            );

            res.status(201).json({ message: 'Collection created successfully', collection: newCollection });
        } catch (error: any) {
            res.status(500).json({ message: 'Error creating collection', error: error.message });
        }
    }

    // Get all collections in a virtual database
    static async getAllCollections(req: Request, res: Response): Promise<void> {
        const { dbId } = req.params;

        try {
            const collections = await VirtualDatabaseCollectionService.getAllCollections(dbId);

            res.status(200).json({ collections });
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching collections', error: error.message });
        }
    }

    // Get a specific collection by ID in a virtual database
    static async getCollectionById(req: Request, res: Response): Promise<void> {
        const { dbId, colId } = req.params;

        try {
            const collection = await VirtualDatabaseCollectionService.getCollectionById(dbId, colId);

            if (!collection) {
                res.status(404).json({ message: 'Collection not found' });
                return;
            }

            res.status(200).json({ collection });
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching collection', error: error.message });
        }
    }

    // Delete a collection by ID in a virtual database
    static async deleteCollection(req: Request, res: Response): Promise<void> {
        const { dbId, colId } = req.params;

        try {
            const deletedCollection = await VirtualDatabaseCollectionService.deleteCollection(dbId, colId);

            if (!deletedCollection) {
                res.status(404).json({ message: 'Collection not found' });
                return;
            }

            res.status(200).json({ message: 'Collection deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting collection', error: error.message });
        }
    }
}

export default VirtualCollectionController;
