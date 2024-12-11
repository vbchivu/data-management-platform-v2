import { IUser } from '../../models/User';
import MySQLPhysicalDatabase, { IMySQLPhysicalDatabase } from '../../models/mysql/MySQLPhysicalDatabase';
import { generatePhysicalDbConnectionString } from '../../utils/connectionStringGenerator';
import logger from '../../../config/winstonLogger';
import bcrypt from 'bcrypt';
import DatabaseConnectionManager from '../DatabaseConnectionManager';
import MySQLSchemaMetadata, { IMySQLSchemaMetadata } from '../../models/mysql/MySQLSchemaMetadata';
import { FieldPacket } from 'mysql2';

class PhysicalDatabaseService {
    /**
     * Create a new physical MySQL database for the user
     */
    static async createDatabase(user: IUser, dbName: string, defaultSchema: string): Promise<IMySQLPhysicalDatabase> {
        logger.info(`Starting the creation process for physical MySQL database '${dbName}' for user '${user._id}'`);

        // Step 1: Check if a physical database with the given name already exists for the user
        const existingDatabase = await MySQLPhysicalDatabase.findOne({ userId: user._id, dbName });
        if (existingDatabase) {
            throw new Error('A database with this name already exists for the user.');
        }

        // Step 2: Check if the user already has credentials for the current database
        const existingCredentials = user.mysqlCredentials?.find((cred) => cred.dbName === dbName);
        if (existingCredentials) {
            logger.info(`User '${user._id}' already has MySQL credentials for database '${dbName}'.`);
            throw new Error('User already has MySQL credentials for this database');
        }

        // Step 3: Generate new credentials
        let username = `user_${Math.random().toString(36).slice(2, 10)}`; // Unique username not using the dbName
        let plainPassword = `password_${Math.random().toString(36).slice(-8)}`; // Generate a simple random password
        let hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Step 4: Create the MySQL user with restricted privileges for accessing the specific database
        const adminPool = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase();
        await adminPool.query(`CREATE USER '${username}'@'%' IDENTIFIED BY '${plainPassword}'`);
        await adminPool.query(`GRANT ALL PRIVILEGES ON ${defaultSchema}.* TO '${username}'@'%'`);
        await adminPool.query(`FLUSH PRIVILEGES`);
        logger.info(`MySQL user '${username}' created successfully with access to database '${dbName}', default schema '${defaultSchema}'`);

        // Step 5: Update user credentials in MongoDB application database
        const newCredential = {
            dbName,
            username,
            password: hashedPassword,
        };
        if (!user.mysqlCredentials) {
            user.mysqlCredentials = [newCredential];
        } else {
            user.mysqlCredentials.push(newCredential);
        }
        await user.save();

        // Step 6: Generate a connection string for the new database
        const connectionString = generatePhysicalDbConnectionString('mysql', {
            dbName,
            user: username,
            password: plainPassword
        });

        // Step 7: Create the physical MySQL database
        await adminPool.query(`CREATE DATABASE ${defaultSchema}`);
        logger.info(`Physical MySQL database '${dbName}' created successfully with default schema '${defaultSchema}'`);

        // Step 8: Store metadata in MongoDB, including the hashed password
        const newDatabase = new MySQLPhysicalDatabase({
            userId: user._id,
            name: dbName,
            defaultSchema,
            connectionString,
            dbUser: {
                username,
                password: hashedPassword, // Store hashed password in MongoDB
            }
        });

        await newDatabase.save();
        logger.info(`Physical MySQL database '${dbName}' and dedicated user '${username}' created successfully for user '${user._id}'`);

        // Step 9: Create the MySQLSchemaMetadata entry for the default schema
        const newDatabaseSchema = new MySQLSchemaMetadata({
            userId: user._id,
            databaseId: newDatabase._id,
            name: defaultSchema,
        });

        await newDatabaseSchema.save();
        logger.info(`Default schema '${defaultSchema}' created successfully for physical MySQL database '${dbName}'`);

        return newDatabase;

    }

    static async createNewSchema(mysqlPhysicalDb: IMySQLPhysicalDatabase, user: IUser, schemaName: string): Promise<IMySQLSchemaMetadata> {
        logger.info(`Starting the creation process for schema '${schemaName}' for physical MySQL database '${mysqlPhysicalDb.name}'`);

        // Step 1: Check if a schema with the given name already exists for the physical database
        const existingSchema = await MySQLSchemaMetadata.findOne({ databaseId: mysqlPhysicalDb._id, name: schemaName });
        if (existingSchema) {
            throw new Error('A schema with this name already exists for the physical database.');
        }

        // Step 2: Get a connection to the physical MySQL database
        const connection = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase();
        if (!connection) {
            throw new Error('Error connecting to the physical MySQL database');
        }

        // Step 3: Create the schema in the physical MySQL database
        try {
            await connection.query(`CREATE DATABASE ${schemaName}`);
            logger.info(`Schema '${schemaName}' created successfully for physical MySQL database '${mysqlPhysicalDb.name}'`);

            // Step 3: Give the user access to the new schema
            await connection.query(`GRANT ALL PRIVILEGES ON ${schemaName}.* TO '${mysqlPhysicalDb.dbUser.username}'@'%'`);
            await connection.query(`FLUSH PRIVILEGES`);
            logger.info(`User '${mysqlPhysicalDb.dbUser.username}' granted access to schema '${schemaName}'`);
        } catch (error: any) {
            logger.error(`Error creating schema '${schemaName}' for physical MySQL database '${mysqlPhysicalDb.name}': ${error.message}`);
            throw new Error('Error creating schema');
        }

        // Step 4: Store metadata in MongoDB
        const newSchema = new MySQLSchemaMetadata({
            userId: user._id,
            databaseId: mysqlPhysicalDb._id,
            name: schemaName,
        });

        await newSchema.save();
        logger.info(`Schema '${schemaName}' created successfully for physical MySQL database '${mysqlPhysicalDb.name}'`);

        // Step 5: Update the physical database metadata with the new schema
        mysqlPhysicalDb.otherSchemas.push(schemaName);
        await mysqlPhysicalDb.save();

        return newSchema;
    }

    static async deleteSchema(mysqlPhysicalDb: IMySQLPhysicalDatabase, user: IUser, schemaName: string): Promise<void> {
        logger.info(`Starting the deletion process for schema '${schemaName}' for physical MySQL database '${mysqlPhysicalDb.name}'`);

        // Step 1: Get the connection to the physical MySQL database
        const connection = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase(schemaName);
        if (!connection) {
            throw new Error('Error connecting to the physical MySQL database');
        }

        // Step 2: Check if schema has any tables except the default tables in mysql schema
        const [tables]: [{ [key: string]: string }[], FieldPacket[]] = await connection.query(
            `SHOW FULL TABLES IN ${schemaName} WHERE Table_type != 'VIEW'`
        ) as [{ [key: string]: string }[], FieldPacket[]];
        if (tables.length > 0) {
            logger.warn(`Schema '${schemaName}' has tables. Cannot delete schema.`);
            throw new Error('Schema has tables. Cannot delete schema');
        }

        try {
            // Step 3: Revoke user access only to the schema named schemaName
            await connection.query(`REVOKE ALL PRIVILEGES ON ${schemaName}.* FROM '${mysqlPhysicalDb.dbUser.username}'@'%'`);
            // Drop the schema from the physical MySQL database
            await connection.query(`DROP DATABASE IF EXISTS ${schemaName}`);
        } catch (error: any) {
            logger.error(`Error deleting schema '${schemaName}' for physical MySQL database '${mysqlPhysicalDb.name}': ${error.message}`);
            throw new Error('Error deleting schema');
        }

        // Step 4: Delete the schema metadata from MongoDB
        await MySQLSchemaMetadata.deleteOne({ databaseId: mysqlPhysicalDb._id, name: schemaName });
        logger.info(`Schema metadata deleted successfully for mysqlPhysicalDb '${mysqlPhysicalDb.name}'`);

        // Step 4: Update the physical database metadata
        mysqlPhysicalDb.otherSchemas = mysqlPhysicalDb.otherSchemas.filter((s) => s !== schemaName);
        await mysqlPhysicalDb.save();
        logger.info(`Physical database metadata updated successfully for schema '${schemaName}'`);

        return Promise.resolve();
    }

    // Method to get all physical MySQL databases for a specific user
    static async getAllDatabases(user: IUser) {
        try {
            const databases = await MySQLPhysicalDatabase.find({ userId: user._id });
            logger.info(`Retrieved ${databases.length} MySQL databases for user '${user._id}'`);
            return databases;
        } catch (error: any) {
            logger.error(`Error retrieving MySQL databases for user '${user._id}': ${error.message}`);
            throw new Error('Error retrieving MySQL databases');
        }
    }

    // Method to get a specific physical MySQL database by ID
    static async getDatabase(user: IUser, databaseId: string) {
        try {
            const database = await MySQLPhysicalDatabase.findOne({ _id: databaseId, userId: user._id });
            if (!database) {
                logger.warn(`MySQL database with ID '${databaseId}' not found for user '${user._id}'`);
                throw new Error('MySQL database not found');
            }
            logger.info(`MySQL database with ID '${databaseId}' retrieved successfully for user '${user._id}'`);
            return database;
        } catch (error: any) {
            logger.error(`Error retrieving MySQL database '${databaseId}' for user '${user._id}': ${error.message}`);
            throw new Error('Error retrieving MySQL database');
        }
    }

    // Method to delete a specific physical MySQL database by name
    static async deleteDatabase(mysqlPhysicalDb: IMySQLPhysicalDatabase, authUser: IUser): Promise<void> {
        try {
            // Step 1: Delete the physical MySQL database
            const connection = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase();

            // Step 2: Get all schemas of the physical database
            const schemas = await MySQLSchemaMetadata.find({ databaseId: mysqlPhysicalDb._id });


            // Step 3: Drop all schemas of the physical database
            for (const schema of schemas) {
                await connection.query(`DROP DATABASE IF EXISTS \`${schema.name}\``);
                logger.info(`Schema '${schema.name}' deleted successfully`);
                await MySQLSchemaMetadata.deleteOne({ _id: schema._id });
            }

            // Step 4: Delete the MySQL user
            await connection.query(`DROP USER IF EXISTS '${mysqlPhysicalDb.dbUser.username}'@'%'`);
            logger.info(`MySQL user '${mysqlPhysicalDb.dbUser.username}' deleted successfully`);

            // Step 5: Disconnect the admin connection used for deletion
            await DatabaseConnectionManager.disconnectAdminMySQLDatabase();

            // Step 6: Remove the database from the user's credentials
            authUser.mysqlCredentials = authUser.mysqlCredentials?.filter((cred) => cred.dbName !== mysqlPhysicalDb.name);
            await authUser.save();

            // Step 7: Delete the metadata from MongoDB
            await MySQLPhysicalDatabase.deleteOne({ _id: mysqlPhysicalDb._id });

            return;
        } catch (error: any) {
            logger.error(`Error deleting physical MySQL database '${mysqlPhysicalDb.name}': ${error.message}`);
            throw new Error('Error deleting physical MySQL database');
        }
    }
}

export default PhysicalDatabaseService;
