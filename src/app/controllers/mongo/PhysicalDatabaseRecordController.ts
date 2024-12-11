import { Response } from 'express';
import PhysicalDatabaseRecordService from '../../services/mongo/PhysicalDatabaseRecordService';
import { AuthenticatedRequest } from '@src/types/AuthenticatedRequest';

class PhysicalDatabaseRecordController {
    // Create a new record in a physical collection
    static async createRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { colId } = req.params;
        const data = req.body;

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
            const newRecord = await PhysicalDatabaseRecordService.createRecord(req.mongoPhysicalDb, colId, data, req.user);
            res.status(201).json({ message: 'Record created successfully', recordId: newRecord._id });
        } catch (error: any) {
            res.status(500).json({ message: 'Error creating record', error: error.message });
        }
    }

    // Get all records in a physical collection
    static async getAllRecords(req: AuthenticatedRequest, res: Response): Promise<void> {
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
            const records = await PhysicalDatabaseRecordService.getAllRecords(req.mongoPhysicalDb, colId, req.user);
            res.status(200).json(records);
        } catch (error: any) {
            res.status(500).json({ message: 'Error retrieving records', error: error.message });
        }
    }

    // Get a specific record by ID from a physical collection
    static async getRecordById(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { colId, recId } = req.params;

        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!colId) {
            res.status(400).json({ message: 'Collection ID is required' });
            return;
        }

        if (!recId) {
            res.status(400).json({ message: 'Record ID is required' });
            return;
        }

        if (!req.mongoPhysicalDb) {
            res.status(500).json({ message: 'Physical database not found' });
            return;
        }

        try {
            const record = await PhysicalDatabaseRecordService.getRecordById(req.mongoPhysicalDb, colId, recId, req.user);
            if (!record) {
                res.status(404).json({ message: 'Record not found' });
                return;
            }

            res.status(200).json(record);
        } catch (error: any) {
            res.status(500).json({ message: 'Error retrieving record', error: error.message });
        }
    }

    // Update a specific record by ID in a physical collection
    static async updateRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { colId, recId } = req.params;
        const updatedData = req.body;

        // Ensure that the required fields are present
        if (!colId || !recId) {
            res.status(400).json({ message: 'Collection ID and Record ID are required.' });
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
            // Call the service to update the record
            const updateResult = await PhysicalDatabaseRecordService.updateRecord(
                req.mongoPhysicalDb,
                colId,
                recId,
                updatedData,
                req.user
            );

            if (updateResult) {
                res.status(200).json({ message: 'Record updated successfully' });
            } else {
                res.status(404).json({ message: 'Record not found' });
            }
        } catch (error: any) {
            res.status(500).json({ message: 'Error updating record', error: error.message });
        }
    }

    // Delete a record by ID from a physical collection
    static async deleteRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { colId, recId } = req.params;

        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!colId) {
            res.status(400).json({ message: 'Collection ID is required' });
            return;
        }

        if (!recId) {
            res.status(400).json({ message: 'Record ID is required' });
            return;
        }

        if (!req.mongoPhysicalDb) {
            res.status(500).json({ message: 'Physical database not found' });
            return;
        }

        try {
            const deletionResult = await PhysicalDatabaseRecordService.deleteRecord(req.mongoPhysicalDb, colId, recId, req.user);
            if (!deletionResult) {
                res.status(404).json({ message: 'Record not found' });
                return;
            }

            res.status(200).json({ message: 'Record deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting record', error: error.message });
        }
    }
}

export default PhysicalDatabaseRecordController;
