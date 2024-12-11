import mongoose, { Connection } from 'mongoose';
import logger from '../../../config/winstonLogger';
import { IMongoPhysicalDatabase } from '../../models/mongo/MongoPhysicalDatabase';
import DatabaseConnectionManager from '../DatabaseConnectionManager';
import { validateRecordAgainstMongoSchema } from '../../utils/validationUtil';
import { IUser } from '../../models/User';

class PhysicalDatabaseRecordService {
    /**
     * Create a new record in a physical collection
     */
    static async createRecord(
        mongoPhysicalDb: IMongoPhysicalDatabase,
        colId: string,
        record: any,
        authUser: IUser,
    ) {
        try {
            // Get or establish the connection to the physical database
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(
                mongoPhysicalDb.connectionString
            );

            if (!connection) {
                logger.error('Error establishing connection to physical database');
                throw new Error('Error establishing connection to physical database');
            }

            if (!connection.db) {
                logger.error('Database connection is undefined');
                throw new Error('Database connection is undefined');
            }

            const metadataCollections = connection.db.collection('collections_metadata');
            const metadataRecord = await metadataCollections.findOne({
                dbId: mongoPhysicalDb._id,
                _id: new mongoose.Types.ObjectId(colId),
            });
            if (!metadataRecord) {
                throw new Error('Collection metadata not found in physical database');
            }

            const collection = connection.db.collection(metadataRecord.collectionName);
            if (!collection) {
                throw new Error('Collection not found in physical database');
            }

            // Insert the record into the collection
            const result = await collection.insertOne(record);
            if (!result.insertedId) {
                logger.error('Error creating record in physical collection');
                throw new Error('Error creating record in physical collection');
            }

            return result.insertedId;
        } catch (error: any) {
            logger.error('Error creating record in physical collection:', error.message);
            throw new Error('Error creating record in physical collection');
        }
    }

    /**
     * Get all records from a physical collection
     */
    static async getAllRecords(mongoPhysicalDb: IMongoPhysicalDatabase, colId: string, authUser: IUser) {
        try {
            // Get or establish the connection to the physical database
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(
                mongoPhysicalDb.connectionString
            );

            if (!connection) {
                logger.error('Error establishing connection to physical database');
                throw new Error('Error establishing connection to physical database');
            }

            if (!connection.db) {
                logger.error('Database connection is undefined');
                throw new Error('Database connection is undefined');
            }

            const metadataCollections = connection.db.collection('collections_metadata');
            const metadataRecord = await metadataCollections.findOne({
                dbId: mongoPhysicalDb._id,
                _id: new mongoose.Types.ObjectId(colId),
            });
            if (!metadataRecord) {
                throw new Error('Collection metadata not found in physical database');
            }

            const collection = connection.db.collection(metadataRecord.collectionName);
            if (!collection) {
                throw new Error('Collection not found in physical database');
            }

            // Get the collection and fetch all records
            const records = await collection.find().toArray();

            return records;
        } catch (error: any) {
            logger.error('Error retrieving records from physical collection:', error.message);
            throw new Error('Error retrieving records from physical collection');
        }
    }

    /**
     * Get a specific record by ID from a physical collection
     */
    static async getRecordById(mongoPhysicalDb: IMongoPhysicalDatabase, colId: string, recId: string, authUser: IUser) {
        try {
            logger.info(`Getting record '${recId}' from physical collection '${colId}' in database '${mongoPhysicalDb.dbName}'`);

            // Get or establish the connection to the physical database
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(
                mongoPhysicalDb.connectionString
            );

            if (!connection) {
                logger.error('Error establishing connection to physical database');
                throw new Error('Error establishing connection to physical database');
            }

            if (!connection.db) {
                logger.error('Database connection is undefined');
                throw new Error('Database connection is undefined');
            }

            const metadataCollections = connection.db.collection('collections_metadata');
            const metadataRecord = await metadataCollections.findOne({
                dbId: mongoPhysicalDb._id,
                _id: new mongoose.Types.ObjectId(colId),
            });
            if (!metadataRecord) {
                throw new Error('Collection metadata not found in physical database');
            }

            const collection = connection.db.collection(metadataRecord.collectionName);
            if (!collection) {
                throw new Error('Collection not found in physical database');
            }

            const record = await collection.findOne({ _id: new mongoose.Types.ObjectId(recId) });
            if (!record) {
                throw new Error('Record not found');
            }

            return record;
        } catch (error: any) {
            logger.error('Error retrieving record from physical collection:', error.message);
            throw new Error('Error retrieving record from physical collection');
        }
    }

    /**
    * Update a specific record by ID in a physical collection
    */
    static async updateRecord(
        mongoPhysicalDb: IMongoPhysicalDatabase,
        colId: string,
        recId: string,
        updatedData: any,
        authUser: IUser
    ) {
        try {
            // Get or establish the connection to the physical database
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(
                mongoPhysicalDb.connectionString
            );

            if (!connection) {
                logger.error('Error establishing connection to physical database');
                throw new Error('Error establishing connection to physical database');
            }

            if (!connection.db) {
                logger.error('Database connection is undefined');
                throw new Error('Database connection is undefined');
            }

            const metadataCollections = connection.db.collection('collections_metadata');
            const metadataRecord = await metadataCollections.findOne({
                dbId: mongoPhysicalDb._id,
                _id: new mongoose.Types.ObjectId(colId),
            });
            if (!metadataRecord) {
                throw new Error('Collection metadata not found in physical database');
            }

            const collection = connection.db.collection(metadataRecord.collectionName);
            if (!collection) {
                throw new Error('Collection not found in physical database');
            }

            // Validate the record against the schema fields if validation is enabled
            if (metadataRecord.useValidator) {
                validateRecordAgainstMongoSchema(updatedData, metadataRecord.fields);
            }

            const updateResult = await collection.updateOne(
                { _id: new mongoose.Types.ObjectId(recId) },
                { $set: updatedData }
            );

            if (updateResult.matchedCount === 0) {
                throw new Error('Record not found');
            }

            return true;
        } catch (error: any) {
            logger.error('Error updating record in physical collection:', error.message);
            throw new Error('Error updating record in physical collection');
        }
    }

    /**
     * Delete a specific record by ID from a physical collection
     */
    static async deleteRecord(mongoPhysicalDb: IMongoPhysicalDatabase, colId: string, recId: string, authUser: IUser) {
        try {
            // Get or establish the connection to the physical database
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(
                mongoPhysicalDb.connectionString
            );

            if (!connection) {
                logger.error('Error establishing connection to physical database');
                throw new Error('Error establishing connection to physical database');
            }

            if (!connection.db) {
                logger.error('Database connection is undefined');
                throw new Error('Database connection is undefined');
            }

            const metadataCollections = connection.db.collection('collections_metadata');
            const metadataRecord = await metadataCollections.findOne({
                dbId: mongoPhysicalDb._id,
                _id: new mongoose.Types.ObjectId(colId),
            });
            if (!metadataRecord) {
                throw new Error('Collection metadata not found in physical database');
            }

            const collection = connection.db.collection(metadataRecord.collectionName);
            if (!collection) {
                throw new Error('Collection not found in physical database');
            }

            const deletionResult = await collection.deleteOne({ _id: new mongoose.Types.ObjectId(recId) });
            if (deletionResult.deletedCount === 0) {
                throw new Error('Record not found');
            }

            return true;
        } catch (error: any) {
            logger.error('Error deleting record from physical collection:', error.message);
            throw new Error('Error deleting record from physical collection');
        }
    }
}

export default PhysicalDatabaseRecordService;
