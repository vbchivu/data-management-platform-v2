import { Request, Response } from 'express';
import PhysicalDatabaseService from '../../services/mysql/PhysicalDatabaseService';
import { AuthenticatedRequest } from '@src/types/AuthenticatedRequest';
import MySQLPhysicalDatabase from '../../models/mysql/MySQLPhysicalDatabase';

class PhysicalDatabaseController {
    // Create a new physical MySQL database
    static async createDatabase(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        const { defaultSchema, dbName } = req.body;

        if (!defaultSchema || !dbName) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }

        try {
            const newDatabase = await PhysicalDatabaseService.createDatabase(req.user, dbName, defaultSchema);
            res.status(201).json({ message: 'Physical MySQL database created successfully', database: newDatabase });
        } catch (error: any) {
            res.status(500).json({ message: 'Error creating physical MySQL database', error: error.message });
        }
    }

    static async createNewSchema(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlPhysicalDb) {
            res.status(400).json({ message: 'Physical MySQL database not found' });
            return;
        }

        const { schemaName } = req.body;

        if (!schemaName) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }

        try {
            const newSchema = await PhysicalDatabaseService.createNewSchema(req.mysqlPhysicalDb, req.user, schemaName);
            res.status(201).json({ message: 'Schema created successfully', schema: newSchema });
        } catch (error: any) {
            res.status(500).json({ message: 'Error creating schema', error: error.message });
        }
    }

    static async deleteSchema(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlPhysicalDb) {
            res.status(400).json({ message: 'Physical MySQL database not found' });
            return;
        }

        if (!req.params.schemaName) {
            res.status(400).json({ message: 'Schema name is required' });
            return;
        }

        try {
            await PhysicalDatabaseService.deleteSchema(req.mysqlPhysicalDb, req.user, req.params.schemaName);
            res.status(200).json({ message: 'Schema deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting schema', error: error.message });
        }
    }


    // Get a list of all physical MySQL databases for the authenticated user
    static async getAllDatabases(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        try {
            const databases = await MySQLPhysicalDatabase.find({ userId: req.user._id });
            res.status(200).json({ databases });
        } catch (error: any) {
            res.status(500).json({ message: 'Error retrieving physical MySQL databases', error: error.message });
        }
    }

    // Get a specific physical MySQL database by ID for the authenticated user
    static async getDatabase(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlPhysicalDb) {
            res.status(400).json({ message: 'Physical MySQL database not found' });
            return;
        }

        res.status(200).json(req.mysqlPhysicalDb);
    }

    // Delete a specific physical MySQL database by ID for the authenticated user
    static async deleteDatabase(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlPhysicalDb) {
            res.status(400).json({ message: 'Physical MySQL database not found' });
            return;
        }

        // Call the service to delete the physical MySQL database
        await PhysicalDatabaseService.deleteDatabase(req.mysqlPhysicalDb, req.user);

        res.status(200).json({ message: 'Physical MySQL database deleted successfully' });
    }
}

export default PhysicalDatabaseController;
