import { Request, Response } from 'express';
import PhysicalDatabaseService from '../../services/mongo/PhysicalDatabaseService';
import { AuthenticatedRequest } from '@src/types/AuthenticatedRequest';

class PhysicalDatabaseController {
    // Create a new physical database
    static async createDatabase(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { dbName } = req.body;

        if (!dbName) {
            res.status(400).json({ message: 'Database name is required' });
            return;
        }

        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        try {
            const newDatabase = await PhysicalDatabaseService.createDatabase(
                req.user,
                dbName,
            );

            res.status(201).json({ message: 'Physical database created successfully', databaseId: newDatabase._id });
        } catch (error: any) {
            res.status(500).json({ message: 'Error creating physical database', error: error.message });
        }
    }

    // Get all physical databases for the authenticated user
    static async getAllDatabases(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        try {
            const databases = await PhysicalDatabaseService.getAllDatabases(req.user);
            res.status(200).json(databases);
        } catch (error: any) {
            res.status(500).json({ message: 'Error retrieving physical databases', error: error.message });
        }
    }

    // Get a specific physical database by ID
    static async getDatabaseById(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mongoPhysicalDb) {
            res.status(404).json({ message: 'Physical database not found' });
        }

        res.status(200).json(req.mongoPhysicalDb);
    }

    // Delete a physical database by ID
    static async deleteDatabase(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mongoPhysicalDb) {
            res.status(404).json({ message: 'Physical database not found' });
            return;
        }

        try {
            const deletionResult = await PhysicalDatabaseService.deleteDatabase(req.mongoPhysicalDb, req.user);
            if (!deletionResult) {
                res.status(404).json({ message: 'Physical database not found' });
                return;
            }

            res.status(200).json({ message: 'Physical database deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting physical database', error: error.message });
        }
    }
}

export default PhysicalDatabaseController;
