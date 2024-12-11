import DatabaseConnectionManager from '@src/app/services/DatabaseConnectionManager';
import dotenv from 'dotenv';
import { Pool } from 'mysql2/promise';

dotenv.config();

/**
 * Create a new physical MySQL database.
 * @param dbName The name of the database to create.
 */
export const createPhysicalMySQLDatabase = async (dbName: string): Promise<void> => {
    try {
        // Use admin credentials to connect to MySQL
        const pool: Pool = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase();

        // Execute query to create the new database
        await pool.query(`CREATE DATABASE ${dbName}`);
        console.log(`Database '${dbName}' created successfully.`);
    } catch (error) {
        throw new Error(`Failed to create MySQL database '${dbName}': ${error}`);
    }
};

/**
 * Create a dedicated MySQL user with privileges for a specific database.
 * @param dbName The name of the database to assign privileges to.
 * @param username The username for the new MySQL user.
 * @param password The password for the new MySQL user.
 */
export const createMySQLUser = async (dbName: string, username: string, password: string): Promise<void> => {
    try {
        // Use admin credentials to connect to MySQL
        const pool: Pool = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase();

        // Create a new user and grant privileges
        await pool.query(`CREATE USER '${username}'@'%' IDENTIFIED BY '${password}'`);
        await pool.query(`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${username}'@'%'`);
        await pool.query(`FLUSH PRIVILEGES`);
        console.log(`User '${username}' created and granted privileges on '${dbName}'.`);
    } catch (error) {
        throw new Error(`Failed to create MySQL user '${username}' for database '${dbName}': ${error}`);
    }
};
