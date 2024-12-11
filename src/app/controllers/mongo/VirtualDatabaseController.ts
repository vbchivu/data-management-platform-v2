import { Response } from 'express';
import VirtualDatabaseService from '../../services/mongo/VirtualDatabaseService';
import { AuthenticatedRequest } from '@src/types/AuthenticatedRequest';

class VirtualDatabaseController {
    // Create a new virtual database
    static async createDatabase(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { dbName } = req.body;

        // Since we have used `authenticateJWT`, we can safely assume req.user is populated
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated.' });
            return;
        }

        if (!dbName) {
            res.status(400).json({ message: 'Database name is required' });
            return;
        }

        try {
            const newDatabase = await VirtualDatabaseService.createDatabase(userId.toString(), dbName);
            res.status(201).json({ message: 'Virtual database created successfully', dbId: newDatabase._id });
        } catch (error: any) {
            res.status(500).json({ message: 'Error creating virtual database', error: error.message });
        }
    }

    static async getAllDatabases(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({ message: 'User not authenticated.' });
                return;
            }

            const databases = await VirtualDatabaseService.getAllDatabases(userId.toString());
            res.status(200).json(databases);
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching virtual databases', error: error.message });
        }
    }

    // Get a virtual database by ID
    static async getDatabaseById(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mongoVirtualDb) {
            res.status(404).json({ message: 'Virtual database not found' });
            return;
        }

        res.status(200).json(req.mongoVirtualDb);
    }

    // Delete a virtual database by ID
    static async deleteDatabase(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { dbId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ message: 'User not authenticated.' });
            return;
        }

        try {
            await VirtualDatabaseService.deleteDatabase(userId.toString(), dbId);
            res.status(200).json({ message: 'Virtual database deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting virtual database', error: error.message });
        }
    }
}

export default VirtualDatabaseController;
