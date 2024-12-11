import mongoose, { Connection } from 'mongoose';
import logger from '../../../config/winstonLogger';
import DatabaseConnectionManager from '../DatabaseConnectionManager';
import { validateRecordAgainstMongoSchema } from '../../utils/validationUtil';
import dotenv from 'dotenv';

dotenv.config();


class VirtualDatabaseRecordService {
    /**
     * Create a new record in a virtual collection
     */
    static async createRecord(dbId: string, colId: string, data: any) {
        let virtualDatabaseConnString = process.env.MONGO_APP_VIRTUAL_DB_URI;
        if (!virtualDatabaseConnString) {
            logger.error('Virtual database connection string is not set in the environment.');
            throw new Error('Virtual database connection string is not set in the environment.');
        }
        // Connect to the virtual database
        const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(virtualDatabaseConnString);
        if (!connection.db) {
            logger.error('Connection to virtual database failed.');
            throw new Error('Connection to virtual database failed.');
        }

        // Retrieve the collection metadata
        const metadataCollection = connection.db.collection('collections_metadata');
        const collection = await metadataCollection.findOne({ _id: new mongoose.Types.ObjectId(colId), dbId: dbId });
        if (!collection) {
            logger.error('Collection not found.');
            throw new Error('Collection not found.');
        }

        // Validate the record against the schema
        validateRecordAgainstMongoSchema(data, collection.fields);

        // Insert the record into the virtual collection
        const collectionInstance = connection.db.collection(collection.collectionName);
        const result = await collectionInstance.insertOne(data);

        if (!result.insertedId) {
            logger.error('Error creating record in virtual collection');
            throw new Error('Error creating record in virtual collection');
        }

        logger.info(`Record created in collection '${collection.collectionName}' with ID: ${result.insertedId}`);
        return { _id: result.insertedId };
    }

    /**
     * Get all records from a virtual collection
     */
    static async getAllRecords(dbId: string, colId: string) {
        try {
            let virtualDatabaseConnString = process.env.MONGO_APP_VIRTUAL_DB_URI;
            if (!virtualDatabaseConnString) {
                logger.error('Virtual database connection string is not set in the environment.');
                throw new Error('Virtual database connection string is not set in the environment.');
            }
            // Connect to the virtual database
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(virtualDatabaseConnString);
            if (!connection.db) {
                logger.error('Connection to virtual database failed.');
                throw new Error('Connection to virtual database failed.');
            }

            // Retrieve the collection metadata
            const metadataCollection = connection.db.collection('collections_metadata');
            const collection = await metadataCollection.findOne({ _id: new mongoose.Types.ObjectId(colId), dbId: dbId });
            if (!collection) {
                logger.error('Collection not found.');
                throw new Error('Collection not found.');
            }

            // Retrieve all records from the collection
            const collectionInstance = connection.db.collection(collection.collectionName);
            return await collectionInstance.find({}).toArray();
        } catch (error) {
            logger.error('Error fetching records from virtual collection:', error);
            throw new Error('Error fetching records from virtual collection');
        }
    }

    /**
     * Get a specific record by ID from a virtual collection
     */
    static async getRecordById(dbId: string, colId: string, recId: string) {
        try {
            let virtualDatabaseConnString = process.env.MONGO_APP_VIRTUAL_DB_URI;
            if (!virtualDatabaseConnString) {
                logger.error('Virtual database connection string is not set in the environment.');
                throw new Error('Virtual database connection string is not set in the environment.');
            }
            // Connect to the virtual database
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(virtualDatabaseConnString);
            if (!connection.db) {
                logger.error('Connection to virtual database failed.');
                throw new Error('Connection to virtual database failed.');
            }

            // Retrieve the collection metadata
            const metadataCollection = connection.db.collection('collections_metadata');
            const collection = await metadataCollection.findOne({ _id: new mongoose.Types.ObjectId(colId), dbId: dbId });
            if (!collection) {
                logger.error('Collection not found.');
                throw new Error('Collection not found.');
            }

            const collectionInstance = connection.db.collection(collection.collectionName);

            return await collectionInstance.findOne({ _id: new mongoose.Types.ObjectId(recId) });
        } catch (error: any) {
            logger.error('Error retrieving record from virtual collection:', error.message);
            throw new Error('Error retrieving record from virtual collection');
        }
    }

    /**
     * Update a specific record by ID in a virtual collection
     */
    static async updateRecord(dbId: string, colId: string, recId: string, data: any) {
        try {
            let virtualDatabaseConnString = process.env.MONGO_APP_VIRTUAL_DB_URI;
            if (!virtualDatabaseConnString) {
                logger.error('Virtual database connection string is not set in the environment.');
                throw new Error('Virtual database connection string is not set in the environment.');
            }
            // Connect to the virtual database
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(virtualDatabaseConnString);
            if (!connection.db) {
                logger.error('Connection to virtual database failed.');
                throw new Error('Connection to virtual database failed.');
            }

            // Retrieve the collection metadata
            const metadataCollection = connection.db.collection('collections_metadata');
            const collection = await metadataCollection.findOne({ _id: new mongoose.Types.ObjectId(colId), dbId: dbId });
            if (!collection) {
                throw new Error('Collection not found.');
            }

            // Validate the record against the schema
            validateRecordAgainstMongoSchema(data, collection.fields);


            // Update the record in the virtual database
            const collectionInstance = connection.db.collection(collection.collectionName);
            const updateResult = await collectionInstance.updateOne(
                { _id: new mongoose.Types.ObjectId(recId) },
                { $set: data }
            );

            if (updateResult.matchedCount === 0) {
                throw new Error('Record not found.');
            }

            logger.info(`Record '${recId}' updated in collection '${collection.collectionName}'`);
            return await collectionInstance.findOne({ _id: new mongoose.Types.ObjectId(recId) });
        } catch (error: any) {
            logger.error('Error updating record in virtual collection:', error.message);
            throw new Error('Error updating record in virtual collection');
        }
    }

    /**
     * Delete a specific record by ID in a virtual collection
     */
    static async deleteRecord(dbId: string, colId: string, recId: string) {
        try {
            let virtualDatabaseConnString = process.env.MONGO_APP_VIRTUAL_DB_URI;
            if (!virtualDatabaseConnString) {
                logger.error('Virtual database connection string is not set in the environment.');
                throw new Error('Virtual database connection string is not set in the environment.');
            }
            // Connect to the virtual database
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(virtualDatabaseConnString);
            if (!connection.db) {
                logger.error('Connection to virtual database failed.');
                throw new Error('Connection to virtual database failed.');
            }

            // Retrieve the collection metadata
            const metadataCollection = connection.db.collection('collections_metadata');
            const collection = await metadataCollection.findOne({ _id: new mongoose.Types.ObjectId(colId), dbId: dbId });
            if (!collection) {
                throw new Error('Collection not found.');
            }

            // Delete the record from the virtual database
            const collectionInstance = connection.db.collection(collection.collectionName);
            const deleteResult = await collectionInstance.deleteOne({ _id: new mongoose.Types.ObjectId(recId) });

            if (deleteResult.deletedCount === 0) {
                throw new Error('Record not found.');
            }

            logger.info(`Record '${recId}' deleted from collection '${collection.collectionName}'`);
            return deleteResult;
        } catch (error: any) {
            logger.error('Error deleting record from virtual collection:', error.message);
            throw new Error('Error deleting record from virtual collection');
        }
    }
}

export default VirtualDatabaseRecordService;
