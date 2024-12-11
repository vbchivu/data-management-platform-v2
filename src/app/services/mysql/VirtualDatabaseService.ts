import logger from '../../../config/winstonLogger';
import MySQLPhysicalDatabase from '../../models/mysql/MySQLPhysicalDatabase';
import MySQLVirtualDatabase from '../../models/mysql/MySQLVirtualDatabase';
import { IUser } from '../../models/User';
import DatabaseConnectionManager from '../DatabaseConnectionManager';
import dotenv from 'dotenv';

dotenv.config();
class VirtualDatabaseService {
    /**
     * Create a virtual database
     */
    static async createVirtualDatabase(user: IUser, dbName: string): Promise<any> {
        // Check if a virtual database with the same name already exists
        const existingDatabase = await MySQLVirtualDatabase.findOne({ userId: user._id, dbName });
        if (existingDatabase) {
            throw new Error('A virtual database with this name already exists.');
        }

        let MySQLPhysicalDatabaseId = process.env.MYSQL_PHYSICAL_DB_ID;
        if (!MySQLPhysicalDatabaseId) {
            throw new Error('MySQL physical database ID not found.');
        }
        let parentPhysicalDb = await MySQLPhysicalDatabase.findById(MySQLPhysicalDatabaseId);
        if (!parentPhysicalDb) {
            throw new Error('Parent physical database not found.');
        }

        const adminPool = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase();
        if (!adminPool) {
            throw new Error('Error connecting to MySQL virtual database.');
        }

        // Create the virtual database
        await adminPool.query(`CREATE DATABASE \`${dbName}\``);
        logger.info(`Virtual database '${dbName}' created successfully`);

        // Save metadata for the virtual database
        const virtualDatabase = new MySQLVirtualDatabase({
            userId: user._id,
            parentPhysicalDbId: parentPhysicalDb._id,
            schemaName: dbName,
        });
        await virtualDatabase.save();

        return virtualDatabase;
    }

    /**
     * Get all virtual databases for the authenticated user
     */
    static async getAllVirtualDatabases(user: IUser): Promise<any[]> {
        const virtualDatabases = await MySQLVirtualDatabase.find({ userId: user._id });
        return virtualDatabases;
    }

    /**
     * Get a virtual database
     * @param user User requesting the database
     * @param dbId Database ID
     * @returns Virtual database
    */
    static async getVirtualDatabase(user: IUser, dbId: string): Promise<any> {
        const database = await MySQLVirtualDatabase.findOne({ _id: dbId, userId: user._id });

        if (!database) {
            throw new Error('Virtual database not found or you do not have permission to access it.');
        }

        return database;
    }

    /**
     * Delete a virtual database
     */
    static async deleteVirtualDatabase(user: IUser, dbId: string): Promise<void> {
        const database = await MySQLVirtualDatabase.findOne({ _id: dbId, userId: user._id });

        if (!database) {
            throw new Error('Virtual database not found or you do not have permission to delete it.');
        }

        const adminPool = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase();
        if (!adminPool) {
            throw new Error('Error connecting to MySQL virtual database.');
        }

        // Check if database exists
        const [rows]: [any[], any[]] = await adminPool.query('SHOW DATABASES');
        const dbExists = rows.some((row) => row.Database === database.schemaName);
        if (!dbExists) {
            throw new Error('Virtual database not found.');
        }

        // Check if the database is empty
        const [tables]: [any[], any] = await adminPool.query(`SHOW TABLES IN \`${database.schemaName}\``);
        if (tables.length > 0) {
            throw new Error('Virtual database is not empty. Please delete all tables before deleting the database.');
        }

        // Drop the virtual database
        await adminPool.query(`DROP DATABASE \`${database.schemaName}\``);

        // Delete the virtual database metadata
        await MySQLVirtualDatabase.findByIdAndDelete(dbId);
    }
}

export default VirtualDatabaseService;
