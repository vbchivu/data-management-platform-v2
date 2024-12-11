import { Request, Response } from 'express';
import PhysicalDatabaseTableService from '../../services/mysql/PhysicalDatabaseTableService';
import { AuthenticatedRequest } from '@src/types/AuthenticatedRequest';

class PhysicalDatabaseTableController {

    // Create a new physical table in a specified database
    static async createTable(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlPhysicalDb) {
            res.status(400).json({ message: 'Physical MySQL database not found' });
            return;
        }

        if (!req.params.schemaName) {
            res.status(400).json({ message: 'Schema name is required.' });
            return;
        }

        const { tableName, columns } = req.body;

        if (!tableName || !columns) {
            res.status(400).json({ message: 'Table name, and columns are required.' });
            return;
        }

        if (columns && !Array.isArray(columns)) {
            res.status(400).json({ message: 'Schema must include an array of column definitions.' });
            return;
        }

        try {
            const newTable = await PhysicalDatabaseTableService.createTable(req.user, req.mysqlPhysicalDb, req.params.schemaName, tableName, columns);
            res.status(201).json({ message: 'Table created successfully.', table: newTable });
        } catch (error: any) {
            res.status(500).json({ message: 'Error creating Table.', error: error.message });
        }
    }

    // Get all tables in a specified physical database
    static async getAllTables(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlPhysicalDb) {
            res.status(400).json({ message: 'Physical MySQL database not found' });
            return;
        }

        if (!req.params.schemaName) {
            res.status(400).json({ message: 'Schema name is required.' });
            return;
        }

        try {
            const tables = await PhysicalDatabaseTableService.getAllTables(req.user, req.mysqlPhysicalDb, req.params.schemaName);
            res.status(200).json({ message: 'Tables retrieved successfully.', tables });
        } catch (error: any) {
            res.status(500).json({ message: 'Error retrieving tables.', error: error.message });
        }
    }

    // Get a specific table by name in a specified physical database
    static async getTableByName(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlPhysicalDb) {
            res.status(400).json({ message: 'Physical MySQL database not found' });
            return;
        }

        if (!req.params.schemaName) {
            res.status(400).json({ message: 'Schema name is required.' });
            return;
        }

        const { tableName } = req.params;

        if (!tableName) {
            res.status(400).json({ message: 'Table name is required.' });
            return;
        }

        try {
            const table = await PhysicalDatabaseTableService.getTableByName(req.user, req.mysqlPhysicalDb, req.params.schemaName, tableName);
            if (!table) {
                res.status(404).json({ message: 'Table not found.' });
                return;
            }
            res.status(200).json({ message: 'Table retrieved successfully.', table });
        } catch (error: any) {
            res.status(500).json({ message: 'Error retrieving table.', error: error.message });
        }
    }


    // Delete a specific table by name in a specified physical database
    static async deleteTable(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlPhysicalDb) {
            res.status(400).json({ message: 'Physical MySQL database not found' });
            return;
        }

        if (!req.params.schemaName) {
            res.status(400).json({ message: 'Schema name is required.' });
            return;
        }

        const { tableName } = req.params;

        if (!tableName) {
            res.status(400).json({ message: 'Table name is required.' });
            return;
        }

        try {
            await PhysicalDatabaseTableService.deleteTable(req.user, req.mysqlPhysicalDb, req.params.schemaName, tableName);
            res.status(200).json({ message: 'Table deleted successfully.' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting table.', error: error.message });
        }
    }
}

export default PhysicalDatabaseTableController;
