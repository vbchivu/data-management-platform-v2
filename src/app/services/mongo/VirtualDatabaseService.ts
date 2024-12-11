import MongoVirtualDatabase from '../../models/mongo/MongoVirtualDatabase';
import VirtualDatabaseCollectionService from './VirtualDatabaseCollectionService';

class MongoVirtualDatabaseService {
    // Create a new virtual database for the given user
    static async createDatabase(userId: string, dbName: string) {
        const newDatabase = new MongoVirtualDatabase({ userId, dbName });
        return await newDatabase.save();
    }

    // Get all virtual databases for a specific user
    static async getAllDatabases(userId: string) {
        return await MongoVirtualDatabase.find({ userId });
    }

    // Get a specific virtual database by ID for a specific user
    static async getDatabaseById(userId: string, dbId: string) {
        return await MongoVirtualDatabase.findOne({ _id: dbId, userId });
    }

    // Delete a virtual database by ID for a specific user
    static async deleteDatabase(userId: string, dbId: string) {
        // Get all the collections in the database
        const collections = await VirtualDatabaseCollectionService.getAllCollections(dbId);
        if (collections.length > 0) {
            return { message: 'Database has collections. Delete collections first.' };
        }

        return await MongoVirtualDatabase.findOneAndDelete({ _id: dbId, userId });
    }
}

export default MongoVirtualDatabaseService;
