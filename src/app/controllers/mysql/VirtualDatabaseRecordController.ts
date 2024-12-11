import { Request, Response } from 'express';
import VirtualDatabaseRecordService from '../../services/mysql/VirtualDatabaseRecordService';
import { AuthenticatedRequest } from '@src/types/AuthenticatedRequest';

class VirtualDatabaseRecordController {
    // Create a new record in a specific table
    static async createRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlVirtualDb) {
            res.status(400).json({ message: 'MySQL database not found.' });
            return;
        }

        const { tableName } = req.params;
        const record = req.body;

        try {
            const newRecord = await VirtualDatabaseRecordService.createRecord(req.user, req.mysqlVirtualDb, tableName, record);
            res.status(201).json({ message: 'Record created successfully.', record: newRecord });
        } catch (error: any) {
            res.status(500).json({ message: 'Error creating record.', error: error.message });
        }
    }

    /**
     * Get all records from a table with optional pagination and filtering.
     * @param req Authenticated request object.
     * @param res Response object.
     */
    static async getAllRecords(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlVirtualDb) {
            res.status(400).json({ message: 'MySQL database not found.' });
            return;
        }

        const { tableName } = req.params;
        if (!tableName) {
            res.status(400).json({ message: 'Table name is required.' });
            return;
        }

        const { page = 1, limit = 10, ...query } = req.query;

        try {
            const result = await VirtualDatabaseRecordService.getAllRecords(
                req.user,
                req.mysqlVirtualDb,
                tableName,
                Number(page),
                Number(limit),
                query
            );
            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ message: 'Error retrieving records', error: error.message });
        }
    }

    // Get a specific record by ID
    static async getRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlVirtualDb) {
            res.status(400).json({ message: 'MySQL database not found.' });
            return;
        }

        const { tableName, recordId } = req.params;
        if (!tableName || !recordId) {
            res.status(400).json({ message: 'Table name and record ID are required.' });
            return;
        }

        try {
            const record = await VirtualDatabaseRecordService.getRecord(req.user, req.mysqlVirtualDb, tableName, recordId);
            if (!record) {
                res.status(404).json({ message: 'Record not found.' });
                return;
            }
            res.status(200).json(record);
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching record.', error: error.message });
        }
    }

    // Update a record by ID
    static async updateRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlVirtualDb) {
            res.status(400).json({ message: 'MySQL database not found.' });
            return;
        }

        const { tableName, recordId } = req.params;
        if (!tableName || !recordId) {
            res.status(400).json({ message: 'Table name and record ID are required.' });
            return;
        }
        const updatedRecordData = req.body;
        if (!updatedRecordData) {
            res.status(400).json({ message: 'Updated record data is required.' });
            return;
        }

        try {
            const updatedRecord = await VirtualDatabaseRecordService.updateRecord(req.user, req.mysqlVirtualDb, tableName, recordId, updatedRecordData);
            res.status(200).json({ message: 'Record updated successfully.', record: updatedRecord });
        } catch (error: any) {
            res.status(500).json({ message: 'Error updating record.', error: error.message });
        }
    }

    // Delete a record by ID
    static async deleteRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!req.mysqlVirtualDb) {
            res.status(400).json({ message: 'MySQL database not found.' });
            return;
        }

        const { tableName, recordId } = req.params;
        if (!tableName || !recordId) {
            res.status(400).json({ message: 'Table name and record ID are required.' });
            return;
        }

        try {
            await VirtualDatabaseRecordService.deleteRecord(req.user, req.mysqlVirtualDb, tableName, recordId);
            res.status(200).json({ message: 'Record deleted successfully.' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting record.', error: error.message });
        }
    }
}

export default VirtualDatabaseRecordController;
