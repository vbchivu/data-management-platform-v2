import mongoose, { Connection } from 'mongoose';
import logger from '../../../config/winstonLogger';
import DatabaseConnectionManager from '../DatabaseConnectionManager';
import { IMongoPhysicalDatabase } from '../../models/mongo/MongoPhysicalDatabase';
import { IUser } from '../../models/User';
import dotenv from 'dotenv';
import CollectionMetadata from '../../models/mongo/CollectionMetadata';

dotenv.config();

class PhysicalDatabaseCollectionService {
    static async createCollection(
        authUser: IUser,
        mongoPhysicalDb: IMongoPhysicalDatabase,
        collectionName: string,
        fields: any,
        useValidator: boolean
    ) {
        try {
            // Get or establish the connection to the physical database
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(
                mongoPhysicalDb.connectionString
            );

            // Check if the connection is valid
            if (!connection.db) {
                throw new Error('Connection to physical database is not established');
            }

            // Check if the collection already exists
            const collections = await connection.db.listCollections({ name: collectionName }).toArray();
            if (collections.length > 0) {
                logger.info(`Collection '${collectionName}' already exists in physical database.`);
                throw new Error('Collection already exists in physical database');
            }

            const createOptions: any = {};
            if (useValidator) {
                createOptions.validator = {
                    $jsonSchema: {
                        bsonType: 'object',
                        required: fields.filter((field: any) => field.required).map((field: any) => field.fieldName),
                        properties: fields.reduce((acc: any, field: any) => {
                            acc[field.fieldName] = {
                                bsonType: field.type,
                                description: field.required ? 'required' : 'optional',
                            };
                            return acc;
                        }, {}),
                    },
                };
            }

            const metadata = new CollectionMetadata({
                _id: new mongoose.Types.ObjectId() as mongoose.Types.ObjectId,
                dbId: mongoPhysicalDb._id,
                collectionName,
                fields,
                useValidator,
                createdAt: new Date(),
                lastUpdated: new Date(),
            });

            // Insert metadata into the virtual database
            const metadataCollection = connection.db.collection('collections_metadata');
            await metadataCollection.insertOne(metadata.toObject() as any);

            await connection.db.createCollection(collectionName, createOptions);
            logger.info(`Collection '${collectionName}' created successfully in physical database.`);

            return { _id: metadata._id };
        } catch (error: any) {
            logger.error('Error creating collection in physical database:', error.message);
            throw new Error('Error creating collection in physical database');
        }
    }

    // Get all collections in a physical database
    static async getAllCollections(mongoPhysicalDb: IMongoPhysicalDatabase) {
        try {
            logger.info(`Retrieving all collections from physical database with dbId: ${mongoPhysicalDb._id}`);

            // Get or establish the connection to the physical database
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(
                mongoPhysicalDb.connectionString
            );

            if (!connection.db) {
                throw new Error('Connection to physical database is not established');
            }

            // Retrieve metadata from the metadata collection
            const metadataCollection = connection.db.collection('collections_metadata');
            const collections = await metadataCollection.find({ dbId: mongoPhysicalDb._id }).toArray();

            logger.info(`Retrieved ${collections.length} collections from physical database.`);
            return collections;
        } catch (error: any) {
            logger.error('Error retrieving collections from physical database:', error.message);
            throw new Error('Error retrieving collections from physical database');
        }
    }

    // Get a specific collection by ID from a physical database
    static async getCollectionById(mongoPhysicalDb: IMongoPhysicalDatabase, colId: string, authUser: IUser) {
        try {
            // Get or establish the connection to the physical database
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(
                mongoPhysicalDb.connectionString
            );

            if (!connection.db) {
                throw new Error('Connection to physical database is not established');
            }

            // Retrieve the collection metadata
            const metadataCollection = connection.db.collection('collections_metadata');
            const collection = await metadataCollection.findOne({ dbId: mongoPhysicalDb._id, _id: new mongoose.Types.ObjectId(colId) });

            if (!collection) {
                throw new Error('Collection not found in physical database');
            }

            logger.info(`Retrieved collection '${colId}' from physical database.`);
            return collection;
        } catch (error: any) {
            logger.error('Error retrieving collection from physical database:', error.message);
            throw new Error('Error retrieving collection from physical database');
        }
    }

    // Delete a specific collection by ID from a physical database
    static async deleteCollection(mongoPhysicalDb: IMongoPhysicalDatabase, colId: string, authUser: IUser) {
        // Get or establish the connection to the physical database
        const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(
            mongoPhysicalDb.connectionString
        );


        if (!connection.db) {
            throw new Error('Connection to physical database is not established');
        }

        // Verify if the collection exists in metadata before attempting to delete it
        const metadataCollections = connection.db.collection('collections_metadata');
        const metadataRecord = await metadataCollections.findOne({
            dbId: mongoPhysicalDb._id,
            _id: new mongoose.Types.ObjectId(colId),
        });

        if (!metadataRecord) {
            throw new Error('Collection metadata not found in physical database');
        }

        try {
            await connection.db.dropCollection(metadataRecord.collectionName);
            logger.info(`Collection '${colId}' deleted successfully from physical database.`);
        } catch (err) {
            logger.error(`Failed to drop collection '${colId}' from physical database: ${err}`);
            throw new Error('Failed to drop collection from physical database');
        }

        // Delete metadata from the metadata collection
        const deletionResult = await metadataCollections.deleteOne({
            dbId: mongoPhysicalDb._id,
            _id: new mongoose.Types.ObjectId(colId),
        });

        if (deletionResult.deletedCount === 0) {
            throw new Error('Failed to delete metadata for collection in physical database');
        }

        logger.info(`Collection '${metadataRecord.collectionName}' deleted successfully from physical database.`);
    }
}

export default PhysicalDatabaseCollectionService;
