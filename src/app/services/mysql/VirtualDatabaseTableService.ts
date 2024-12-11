import { IMySQLVirtualDatabase } from '../../models/mysql/MySQLVirtualDatabase';
import DatabaseConnectionManager from '../DatabaseConnectionManager';
import logger from '../../../config/winstonLogger';
import { IUser } from '@src/app/models/User';

class VirtualDatabaseTableService {
    // Create a new table
    static async createTable(mysqlVirtualDb: IMySQLVirtualDatabase, tableName: string, columns: any[]): Promise<any> {
        // Step 1: Connect to the virtual database as an admin
        const dbConnection = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase(mysqlVirtualDb.schemaName);
        if (!dbConnection) {
            throw new Error('Error connecting to MySQL virtual database.');
        }

        // Step 2: Check if table already exists
        const [existingTables] = await dbConnection.query('SHOW TABLES');
        const tables = (existingTables as any[]).map((row: any) => Object.values(row)[0]);
        if (tables.includes(tableName)) {
            throw new Error(`Table '${tableName}' already exists in database '${mysqlVirtualDb.schemaName}'`);
        }

        // Step 3: Construct the `CREATE TABLE` query based on column definitions
        const columnsDefinition = columns.map(col => {
            let columnDef = `\`${col.name}\` ${col.type}`;
            if (col.autoIncrement) {
                columnDef += ' AUTO_INCREMENT';
            }
            if (col.primaryKey) {
                columnDef += ' PRIMARY KEY';
            }
            if (col.default !== undefined) {
                columnDef += ` DEFAULT ${col.default === 'CURRENT_TIMESTAMP' ? col.default : `'${col.default}'`}`;
            }
            return columnDef;
        }).join(', ');

        const createTableQuery = `CREATE TABLE \`${tableName}\` (${columnsDefinition})`;

        // Step 4: Execute the `CREATE TABLE` query
        await dbConnection.execute(createTableQuery);
        logger.info(`Physical table '${tableName}' created successfully in database '${mysqlVirtualDb.schemaName}'`);

        return { tableName, columns };
    }

    // Get all tables in a schema
    static async getAllTables(user: IUser, mysqlVirtualDb: IMySQLVirtualDatabase): Promise<any[]> {
        const connection = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase(mysqlVirtualDb.schemaName);
        if (!connection) {
            throw new Error('Error connecting to MySQL virtual database.');
        }

        const [rows] = await connection.query('SHOW TABLES');
        const tables = (rows as any[]).map((row: any) => Object.values(row)[0]);

        return tables;
    }

    // Get a table by name
    static async getTableByName(user: IUser, mysqlVirtualDb: IMySQLVirtualDatabase, tableName: string): Promise<any | null> {
        const connection = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase(mysqlVirtualDb.schemaName);
        if (!connection) {
            throw new Error('Error connecting to MySQL virtual database.');
        }

        const [columns] = await connection.query(`DESCRIBE \`${tableName}\``);

        logger.info(`Successfully retrieved table '${tableName}' from database '${mysqlVirtualDb.schemaName}'`);
        return { tableName, columns };
    }

    // Delete a table by ID
    static async deleteTable(user: IUser, mysqlVirtualDb: IMySQLVirtualDatabase, tableName: string): Promise<any | null> {
        const connection = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase(mysqlVirtualDb.schemaName);
        if (!connection) {
            throw new Error('Error connecting to MySQL virtual database.');
        }

        // Check if table exists
        const [existingTables] = await connection.query('SHOW TABLES');
        const tables = (existingTables as any[]).map((row: any) => Object.values(row)[0]);
        if (!tables.includes(tableName)) {
            throw new Error(`Table '${tableName}' does not exist in database '${mysqlVirtualDb.schemaName}'`);
        }

        const [result] = await connection.query(`DROP TABLE \`${tableName}\``);

        return result;
    }
}

export default VirtualDatabaseTableService;
