import { Response } from 'express';
import VirtualDatabaseRecordService from '../../services/mongo/VirtualDatabaseRecordService';
import { AuthenticatedRequest } from '@src/types/AuthenticatedRequest';

class VirtualDatabaseRecordController {
    // Create a new record in a virtual collection
    static async createRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { dbId, colId } = req.params;
        const data = req.body;

        try {
            const newRecord = await VirtualDatabaseRecordService.createRecord(dbId, colId, data);
            if (newRecord) {
                res.status(201).json({ message: 'Record created successfully', recordId: newRecord._id });
            } else {
                res.status(500).json({ message: 'Error creating record', error: 'New record is null' });
            }
        } catch (error: any) {
            res.status(500).json({ message: 'Error creating record', error: error.message });
        }
    }

    // Get all records in a virtual collection
    static async getAllRecords(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { dbId, colId } = req.params;

        try {
            const records = await VirtualDatabaseRecordService.getAllRecords(dbId, colId);
            res.status(200).json(records);
        } catch (error: any) {
            res.status(500).json({ message: 'Error retrieving records', error: error.message });
        }
    }

    // Get a specific record by ID from a virtual collection
    static async getRecordById(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { dbId, colId, recId } = req.params;

        try {
            const record = await VirtualDatabaseRecordService.getRecordById(dbId, colId, recId);
            if (!record) {
                res.status(404).json({ message: 'Record not found' });
                return;
            }

            res.status(200).json(record);
        } catch (error: any) {
            res.status(500).json({ message: 'Error retrieving record', error: error.message });
        }
    }

    // Update a record by ID from a virtual collection
    static async updateRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { dbId, colId, recId } = req.params;
        const updatedData = req.body;

        // Ensure that required parameters are present
        if (!dbId || !colId || !recId) {
            res.status(400).json({ message: 'Database ID, Collection ID, and Record ID are required.' });
            return;
        }

        try {
            // Call the service to update the record in the virtual collection
            const updatedRecord = await VirtualDatabaseRecordService.updateRecord(dbId, colId, recId, updatedData);

            if (!updatedRecord) {
                res.status(404).json({ message: 'Record not found' });
                return;
            }

            res.status(200).json({ message: 'Record updated successfully', updatedRecord });
        } catch (error: any) {
            res.status(500).json({ message: 'Error updating record', error: error.message });
        }
    }

    // Delete a record by ID from a virtual collection
    static async deleteRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { dbId, colId, recId } = req.params;

        try {
            const deletionResult = await VirtualDatabaseRecordService.deleteRecord(dbId, colId, recId);
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

export default VirtualDatabaseRecordController;
