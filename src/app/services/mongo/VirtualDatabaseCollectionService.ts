import mongoose, { Connection } from 'mongoose';
import logger from '../../../config/winstonLogger';
import DatabaseConnectionManager from '../DatabaseConnectionManager';
import dotenv from 'dotenv';
import CollectionMetadata from '../../models/mongo/CollectionMetadata';

dotenv.config();

class VirtualDatabaseCollectionService {
    static async createCollection(
        dbId: string,
        collectionName: string,
        fields: any,
        useValidator: boolean = false
    ) {
        try {
            logger.info(`Starting to create virtual collection '${collectionName}' in virtual database with dbId: '${dbId}'`);

            let virtualDatabaseConnString = process.env.MONGO_APP_VIRTUAL_DB_URI;
            if (!virtualDatabaseConnString) {
                throw new Error('Virtual database connection string is not set in the environment.');
            }
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(virtualDatabaseConnString);
            if (!connection.db) {
                throw new Error('Connection to virtual database failed.');
            }

            const collections = await connection.db.listCollections({ name: collectionName }).toArray();
            if (collections.length > 0) {
                logger.info(`Collection '${collectionName}' already exists in physical database.`);
                throw new Error('Collection already exists in physical database');
            }

            // Prepare the JSON Schema Validator
            const validator = useValidator
                ? {
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
                }
                : undefined;

            const metadata = new CollectionMetadata({
                _id: new mongoose.Types.ObjectId() as mongoose.Types.ObjectId,
                dbId,
                collectionName,
                fields,
                useValidator,
                createdAt: new Date(),
                lastUpdated: new Date(),
            });

            // Insert metadata into the virtual database
            const metadataCollection = connection.db.collection('collections_metadata');
            await metadataCollection.insertOne(metadata.toObject() as any);

            await connection.db.createCollection(collectionName, validator ? { validator } : undefined);

            logger.info(`Virtual collection '${collectionName}' created successfully in database '${dbId}'`);
            return { _id: metadata._id };
        } catch (error: any) {
            logger.error(`Error creating virtual collection '${collectionName}': ${error.message}`);
            throw new Error(`Error creating virtual collection: ${error.message}`);
        }
    }

    // Get all collections in a virtual database
    static async getAllCollections(dbId: string) {
        try {
            logger.info(`Fetching all collections in virtual database '${dbId}'`);

            let virtualDatabaseConnString = process.env.MONGO_APP_VIRTUAL_DB_URI;
            if (!virtualDatabaseConnString) {
                throw new Error('Virtual database connection string is not set in the environment.');
            }

            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(virtualDatabaseConnString);
            if (!connection.db) {
                throw new Error('Connection to virtual database failed.');
            }

            const metadataCollection = connection.db.collection('collections_metadata');
            const collections = await metadataCollection.find({ dbId: dbId }).toArray();

            logger.info(`Fetched ${collections.length} collections from virtual database '${dbId}'`);
            return collections;
        } catch (error: any) {
            logger.error(`Error fetching collections for database '${dbId}': ${error.message}`);
            throw new Error(`Error fetching collections: ${error.message}`);
        }
    }

    // Get a specific collection by ID
    static async getCollectionById(dbId: string, colId: string) {
        try {
            logger.info(`Fetching collection '${colId}' in database '${dbId}'`);

            let virtualDatabaseConnString = process.env.MONGO_APP_VIRTUAL_DB_URI;
            if (!virtualDatabaseConnString) {
                throw new Error('Virtual database connection string is not set in the environment.');
            }
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(virtualDatabaseConnString);
            if (!connection.db) {
                throw new Error('Connection to virtual database failed.');
            }

            const metadataCollection = connection.db.collection('collections_metadata');
            const collection = await metadataCollection.findOne({ _id: new mongoose.Types.ObjectId(colId), dbId: dbId });

            if (!collection) {
                throw new Error(`Collection with ID '${colId}' not found.`);
            }

            logger.info(`Fetched collection '${collection.collectionName}'`);
            return collection;
        } catch (error: any) {
            logger.error(`Error fetching collection '${colId}' in database '${dbId}': ${error.message}`);
            throw new Error(`Error fetching collection: ${error.message}`);
        }
    }

    // Delete a specific collection
    static async deleteCollection(dbId: string, colId: string) {
        try {
            logger.info(`Starting deletion of collection '${colId}' from database '${dbId}'`);

            let virtualDatabaseConnString = process.env.MONGO_APP_VIRTUAL_DB_URI;
            if (!virtualDatabaseConnString) {
                throw new Error('Virtual database connection string is not set in the environment.');
            }
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(virtualDatabaseConnString);
            if (!connection.db) {
                throw new Error('Connection to virtual database failed.');
            }

            const metadataCollection = connection.db.collection('collections_metadata');
            const collection = await metadataCollection.findOne({ _id: new mongoose.Types.ObjectId(colId), dbId: dbId });

            if (!collection) {
                throw new Error(`Collection with ID '${colId}' not found in database '${dbId}'`);
            }

            const deleteResult = await metadataCollection.deleteOne({ _id: new mongoose.Types.ObjectId(colId) });

            if (!deleteResult.deletedCount) {
                throw new Error(`Failed to delete collection metadata for '${collection.collectionName}' from application database`);
            }

            const collectionDeletionResult = await connection.db.dropCollection(collection.collectionName);
            if (!collectionDeletionResult) {
                logger.warn(`Failed to delete collection '${collection.collectionName}' from virtual database.`);
            } else {
                logger.info(`Deleted collection '${collection.collectionName}' from virtual database.`);
            }

            return collection;
        } catch (error: any) {
            logger.error(`Error deleting collection '${colId}' from database '${dbId}': ${error.message}`);
            throw new Error(`Error deleting collection: ${error.message}`);
        }
    }
}

export default VirtualDatabaseCollectionService;
