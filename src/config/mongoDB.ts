import DatabaseConnectionManager from "../app/services/DatabaseConnectionManager";
import logger from "./winstonLogger";

/**
 * Utility functions to initialize and manage the application-level MongoDB connection.
 */

// Connect to the main application MongoDB instance
export const initializeAppDatabase = async (): Promise<void> => {
    await DatabaseConnectionManager.connectToAppDatabase();
};

// Disconnect all connections (application and physical) during shutdown
export const closeAllConnections = async (): Promise<void> => {
    await DatabaseConnectionManager.disconnectAll();
};

/**
 * Create a dedicated MongoDB user with privileges for a specific database.
 * @param dbName The name of the database.
 * @param username The username for the new MongoDB user.
 * @param password The password for the new MongoDB user.
 */
export const createMongoDBUser = async (
    dbName: string,
    username: string,
    password: string
): Promise<void> => {
    try {
        // Establish a connection as an admin to perform operations in the target database
        const adminConnection = await DatabaseConnectionManager.connectAsAdminToDatabase(dbName);

        if (!adminConnection.db) {
            throw new Error('Connection to MongoDB Admin is not established.');
        }

        // Log before attempting to create the user
        logger.info(`Attempting to create MongoDB user '${username}' for database '${dbName}'`);

        // Use the plain password here (not the hashed version)
        const db = adminConnection.db; // Native MongoDB Database object
        await db.command({
            createUser: username,
            pwd: password,
            roles: [
                {
                    role: 'readWrite',
                    db: dbName,
                },
            ],
        });

        logger.info(`MongoDB user '${username}' created successfully with access to database '${dbName}'`);
    } catch (error: any) {
        logger.error(`Failed to create MongoDB user: ${error.message}`);
        throw new Error(`Failed to create MongoDB user: ${error.message}`);
    }
};
