import { Response } from 'express';
import VirtualDatabaseTableService from '../../services/mysql/VirtualDatabaseTableService';
import { AuthenticatedRequest } from '@src/types/AuthenticatedRequest';

class VirtualDatabaseTableController {
    // Create a new table
    static async createTable(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        if (!req.mysqlVirtualDb) {
            res.status(400).json({ message: 'MySQL virtual database not found' });
            return;
        }

        const { tableName, schema } = req.body;

        if (!tableName || !schema) {
            res.status(400).json({ message: 'Table name and schema are required' });
            return;
        }

        if (schema && !Array.isArray(schema.columns)) {
            res.status(400).json({ message: 'Schema must include an array of column definitions.' });
            return;
        }

        try {
            const table = await VirtualDatabaseTableService.createTable(req.mysqlVirtualDb, tableName, schema.columns);
            res.status(201).json({ message: 'Table created successfully', table });
        } catch (error: any) {
            res.status(500).json({ message: 'Error creating table', error: error.message });
        }
    }

    // Get all tables in a schema
    static async getAllTables(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        if (!req.mysqlVirtualDb) {
            res.status(400).json({ message: 'MySQL virtual database not found' });
            return;
        }

        try {
            const tables = await VirtualDatabaseTableService.getAllTables(req.user, req.mysqlVirtualDb);
            res.status(200).json({ tables });
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching tables', error: error.message });
        }
    }

    static async getTableByName(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        if (!req.mysqlVirtualDb) {
            res.status(400).json({ message: 'MySQL virtual database not found' });
            return;
        }

        const { tableName } = req.params;

        if (!tableName) {
            res.status(400).json({ message: 'Table name is required' });
            return;
        }

        try {
            const table = await VirtualDatabaseTableService.getTableByName(req.user, req.mysqlVirtualDb, tableName);
            if (!table) {
                res.status(404).json({ message: 'Table not found' });
                return;
            }

            res.status(200).json({ table });
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching table', error: error.message });
        }
    }

    // Delete a table by ID
    static async deleteTable(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        if (!req.mysqlVirtualDb) {
            res.status(400).json({ message: 'MySQL virtual database not found' });
            return;
        }

        const { tableName } = req.params;

        try {
            const deletedTable = await VirtualDatabaseTableService.deleteTable(req.user, req.mysqlVirtualDb, tableName);
            if (!deletedTable) {
                res.status(404).json({ message: 'Table not found' });
                return;
            }

            res.status(200).json({ message: 'Table deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting table', error: error.message });
        }
    }
}

export default VirtualDatabaseTableController;
