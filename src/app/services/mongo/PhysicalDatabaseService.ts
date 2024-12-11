import logger from '../../../config/winstonLogger';
import MongoPhysicalDatabase, { IMongoPhysicalDatabase } from '../../models/mongo/MongoPhysicalDatabase';
import { IUser } from '../../models/User';
import { generatePhysicalDbConnectionString } from '../../utils/connectionStringGenerator';
import { Connection } from 'mongoose';
import DatabaseConnectionManager from '../DatabaseConnectionManager';
import bcrypt from 'bcrypt';
import { Db } from 'mongodb';
import PhysicalDatabaseCollectionService from './PhysicalDatabaseCollectionService';

class PhysicalDatabaseService {
    // Create a new physical database for the given user
    static async createDatabase(user: IUser, dbName: string): Promise<IMongoPhysicalDatabase> {
        logger.info(`Creating a new physical MongoDB database '${dbName}' for user '${user._id}'`);

        // Step 1: Ensure no duplicate database name exists for the user
        await PhysicalDatabaseService.ensureUniqueDatabaseName(user, dbName);

        // Step 2: Initialize the database in MongoDB
        const { username, plainPassword, hashedPassword, connectionString } =
            await PhysicalDatabaseService.initializeMongoDatabase(user, dbName);

        // Step 3: Update application metadata
        const newDatabase = await PhysicalDatabaseService.saveDatabaseMetadata(user, dbName, username, hashedPassword, connectionString);

        logger.info(`Physical MongoDB database '${dbName}' created successfully for user '${user._id}'`);
        return newDatabase;
    }

    // Get all physical databases for a specific user
    static async getAllDatabases(user: IUser): Promise<IMongoPhysicalDatabase[]> {
        try {
            logger.info(`Fetching all physical databases for user '${user._id}'`);
            // Fetch all physical databases for the given user
            const databases = await MongoPhysicalDatabase.find({ userId: user._id }).exec();
            return databases;
        } catch (error: any) {
            logger.error('Error retrieving physical databases:', error.message);
            throw new Error('Error retrieving physical databases');
        }
    }

    // Get a specific physical database by its ID
    static async getDatabaseById(user: IUser, dbId: string): Promise<IMongoPhysicalDatabase | null> {
        try {
            logger.info(`Fetching physical database '${dbId}' for user '${user._id}'`);

            // Fetch the physical database by ID and check if it belongs to the user
            const database = await MongoPhysicalDatabase.findOne({ _id: dbId, userId: user._id }).exec();
            if (!database) {
                logger.warn(`Physical database '${dbId}' not found for user '${user._id}'`);
                return null;
            }

            return database;
        } catch (error: any) {
            logger.error('Error retrieving physical database:', error.message);
            throw new Error('Error retrieving physical database');
        }
    }

    // Delete a physical database by its ID
    static async deleteDatabase(mongoPhysicalDb: IMongoPhysicalDatabase, user: IUser): Promise<boolean> {
        try {
            // Connect to the physical database
            const connection: Connection = await DatabaseConnectionManager.connectToPhysicalMongoDB(
                mongoPhysicalDb.connectionString
            );

            if (!connection.db) {
                throw new Error('Connection to physical database is not established');
            }

            const collections = PhysicalDatabaseCollectionService.getAllCollections(mongoPhysicalDb);
            if ((await collections).length > 0) {
                throw new Error('Database has collections. Delete collections first.');
            }

            // Drop all collections and the database itself
            await connection.db.dropDatabase();
            logger.info(`Dropped physical database '${mongoPhysicalDb.dbName}' successfully`);

            // Delete metadata from the application database
            const deletionResult = await MongoPhysicalDatabase.findOneAndDelete({ _id: mongoPhysicalDb._id, userId: user._id }).exec();

            if (!deletionResult) {
                logger.warn(`Physical database '${mongoPhysicalDb._id}' not found for user '${user._id}'`);
                return false;
            }

            user.mongoCredentials = user.mongoCredentials?.filter((cred) => cred.dbName !== mongoPhysicalDb.dbName);
            await user.save();

            logger.info(`Physical database '${mongoPhysicalDb._id}' deleted successfully for user '${user._id}'`);
            return true;
        } catch (error: any) {
            logger.error('Error deleting physical database:', error.message);
            throw new Error('Error deleting physical database');
        }
    }

    // Ensure no duplicate database name exists for the user
    private static async ensureUniqueDatabaseName(user: IUser, dbName: string): Promise<void> {
        const existingDatabase = await MongoPhysicalDatabase.findOne({ userId: user._id, dbName });
        if (existingDatabase) {
            throw new Error('A database with this name already exists for the user.');
        }
    }

    // Initialize the database in MongoDB
    private static async initializeMongoDatabase(
        user: IUser,
        dbName: string
    ): Promise<{ username: string; plainPassword: string; hashedPassword: string; connectionString: string }> {
        const adminConnection = await DatabaseConnectionManager.connectAsAdminToDatabase('admin');
        if (!adminConnection.db) {
            throw new Error('Admin connection to MongoDB is not established');
        }

        const dbConnection = adminConnection.useDb(dbName, { useCache: true });
        const db = dbConnection.db;

        if (!db) {
            throw new Error('Connection to physical database is not established');
        }

        try {
            // Create initial collections
            await db.createCollection('collections_metadata');
            await db.createCollection('users');
            logger.info(`Initial collections created successfully in database '${dbName}'`);

            // Manage database credentials
            const credentials = await PhysicalDatabaseService.manageDatabaseCredentials(user, db, dbName);

            if (!credentials) {
                throw new Error('Error managing database credentials');
            }

            const connectionString = generatePhysicalDbConnectionString('mongo', {
                dbName,
                user: credentials.username,
                password: credentials.plainPassword,
            });

            // Validate the connection to the new database
            const testConnection = await DatabaseConnectionManager.connectToPhysicalMongoDB(connectionString);

            if (!testConnection.db) {
                throw new Error('Validation failed: Unable to connect to the newly created database');
            }

            return { ...credentials, connectionString };
        } catch (error) {
            logger.error(`Error during database initialization: ${error}`);
            // Roll back: Drop the database if initialization fails
            await adminConnection.db.dropDatabase();
            throw new Error(`Database initialization failed: ${error}`);
        }
    }

    // Manage database credentials for the user
    private static async manageDatabaseCredentials(
        user: IUser,
        db: Db,
        dbName: string
    ): Promise<{ username: string; plainPassword: string; hashedPassword: string }> {
        const existingCredentials = user.mongoCredentials?.find((cred) => cred.dbName === dbName);
        if (existingCredentials) {
            logger.error(`User '${user._id}' already has credentials for database '${dbName}'.`);
            db.dropDatabase();
            throw new Error('User already has credentials for this database');
        }

        const username = `user_${Math.random().toString(36).slice(2, 10)}`;
        const plainPassword = `password_${Math.random().toString(36).slice(-8)}`;
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        await db.command({
            createUser: username,
            pwd: plainPassword,
            roles: [{ role: 'readWrite', db: dbName }],
        });
        logger.info(`MongoDB user '${username}' created successfully with access to database '${dbName}'`);

        user.mongoCredentials = [];
        user.mongoCredentials.push({ dbName, username, password: hashedPassword });
        await user.save();

        return { username, plainPassword, hashedPassword };
    }

    // Save database metadata in the application database
    private static async saveDatabaseMetadata(
        user: IUser,
        dbName: string,
        username: string,
        hashedPassword: string,
        connectionString: string
    ): Promise<IMongoPhysicalDatabase> {
        const newDatabase = await MongoPhysicalDatabase.create({
            userId: user._id,
            dbName,
            connectionString,
            dbUser: {
                username,
                password: hashedPassword,
            },
            createdAt: new Date(),
        });

        if (!newDatabase) {
            throw new Error('Error saving database metadata');
        }

        return newDatabase;
    }
}

export default PhysicalDatabaseService;
