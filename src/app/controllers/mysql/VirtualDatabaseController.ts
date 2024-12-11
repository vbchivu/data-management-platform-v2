import { Request, Response } from 'express';
import VirtualDatabaseService from '../../services/mysql/VirtualDatabaseService';
import { AuthenticatedRequest } from '@src/types/AuthenticatedRequest';

class VirtualDatabaseController {
    /**
     * Create a virtual database
     */
    static async createDatabase(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        const { dbName } = req.body;

        if (!dbName) {
            res.status(400).json({ message: 'Database name is required.' });
            return;
        }

        try {
            const virtualDatabase = await VirtualDatabaseService.createVirtualDatabase(req.user, dbName);
            res.status(201).json({ message: 'Virtual database created successfully.', database: virtualDatabase });
        } catch (error: any) {
            res.status(500).json({ message: 'Error creating virtual database.', error: error.message });
        }
    }

    /**
     * Get all virtual databases for the authenticated user
     */
    static async getAllDatabases(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        try {
            const virtualDatabases = await VirtualDatabaseService.getAllVirtualDatabases(req.user);
            res.status(200).json({ databases: virtualDatabases });
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching virtual databases.', error: error.message });
        }
    }


    static async getDatabase(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlVirtualDb) {
            res.status(400).json({ message: 'MySQL virtual database not found.' });
            return;
        }

        try {
            res.status(200).json({ database: req.mysqlVirtualDb });
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching virtual database.', error: error.message });
        }
    }

    /**
     * Delete a virtual database
     */
    static async deleteDatabase(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        const { dbId } = req.params;

        if (!dbId) {
            res.status(400).json({ message: 'Database ID is required.' });
            return;
        }

        try {
            await VirtualDatabaseService.deleteVirtualDatabase(req.user, dbId);
            res.status(200).json({ message: 'Virtual database deleted successfully.' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting virtual database.', error: error.message });
        }
    }
}

export default VirtualDatabaseController;
