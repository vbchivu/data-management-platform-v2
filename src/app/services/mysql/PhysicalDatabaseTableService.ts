import DatabaseConnectionManager from '../DatabaseConnectionManager';
import { IUser } from '../../models/User';
import { IMySQLPhysicalDatabase } from '../../models/mysql/MySQLPhysicalDatabase';
import logger from '../../../config/winstonLogger';
import TableMetadata from '../../models/mysql/TableMetadata';
import MySQLSchemaMetadata from '../../models/mysql/MySQLSchemaMetadata';

class PhysicalDatabaseTableService {
    /**
     * Create a new table in a physical MySQL database.
     * @param user The authenticated user making the request.
     * @param dbId The database ID.
     * @param tableName The name of the table to be created.
     * @param columns The column definitions for the new table.
     */
    static async createTable(user: IUser, mysqlPhysicalDb: IMySQLPhysicalDatabase, schemaName: string, tableName: string, columns: { name: string, type: string, primaryKey?: boolean, autoIncrement?: boolean, default?: string }[]): Promise<any> {
        try {
            // Step 1: Check if the schema exists
            const schema = await MySQLSchemaMetadata.findOne({ name: schemaName, databaseId: mysqlPhysicalDb.id });
            if (!schema) {
                throw new Error(`Schema '${schemaName}' does not exist in database '${mysqlPhysicalDb.name}'`);
            }

            const table = await TableMetadata.findOne({ tableName: tableName, schemaId: schema._id });
            if (table) {
                throw new Error(`Table '${tableName}' already exists in schema '${schemaName}'`);
            }

            // Step 3: Establish a connection to the MySQL database
            const dbConnection = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase(schemaName);
            // const dbConnection = await DatabaseConnectionManager.connectToMySQLDatabase(mysqlPhysicalDb.connectionString + schemaName);
            if (!dbConnection) {
                throw new Error('Error establishing connection to MySQL database');
            }

            // Step 4: Construct the `CREATE TABLE` query based on column definitions
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

            const pool = await dbConnection.getConnection();

            logger.info(`Creating table '${tableName}' in database '${mysqlPhysicalDb.name}' in schema '${schemaName}'`);
            // Step 5: Execute the `CREATE TABLE` query
            await pool.execute(createTableQuery);
            logger.info(`Physical table '${tableName}' created successfully in database '${mysqlPhysicalDb.name}' in schema '${schemaName}'`);

            // Step 6: Save the table metadata to the database
            const tableMetadata = new TableMetadata({
                schemaId: schema._id,
                tableName,
                fields: columns.map(col => ({ fieldName: col.name, type: col.type, required: false })),
            });
            await tableMetadata.save();

            return { tableName, columns };
        } catch (error: any) {
            logger.error(`Error occurred while creating table '${tableName}':`, error.message);
            throw new Error(`Error creating table '${tableName}': ${error.message}`);
        }
    }

    /**
     * Get all tables in a specified physical database.
     * @param user The authenticated user making the request.
     * @param dbId The database ID.
     */
    static async getAllTables(user: IUser, mysqlPhysicalDb: IMySQLPhysicalDatabase, schemaName: string): Promise<any[]> {
        try {
            // Step 1: Establish a connection to the MySQL database
            const dbConnection = await DatabaseConnectionManager.connectToMySQLDatabase(mysqlPhysicalDb.connectionString + schemaName);
            if (!dbConnection) {
                throw new Error('Error establishing connection to MySQL database');
            }

            // Step 2: Query to list all tables in the database
            const [rows] = await dbConnection.query('SHOW TABLES');
            const tables = (rows as any[]).map((row: any) => Object.values(row)[0]);

            logger.info(`Successfully retrieved tables from database '${mysqlPhysicalDb.name}' in schema '${schemaName}'`);
            return tables;
        } catch (error: any) {
            logger.error(`Error occurred while retrieving tables from database '${mysqlPhysicalDb.id}':`, error.message);
            throw new Error(`Error retrieving tables from database '${mysqlPhysicalDb.id}': ${error.message}`);
        }
    }

    /**
     * Get a specific table by name in a physical MySQL database.
     * @param user The authenticated user making the request.
     * @param dbId The database ID.
     * @param tableName The name of the table.
     */
    static async getTableByName(user: IUser, mysqlPhysicalDb: IMySQLPhysicalDatabase, schemaName: string, tableName: string): Promise<any> {
        try {
            // Step 1: Establish a connection to the MySQL database
            const dbConnection = await DatabaseConnectionManager.connectToMySQLDatabase(mysqlPhysicalDb.connectionString + schemaName);
            if (!dbConnection) {
                throw new Error('Error establishing connection to MySQL database');
            }

            // Step 2: Describe the table to get its details
            const [columns] = await dbConnection.query(`DESCRIBE \`${tableName}\``);

            logger.info(`Successfully retrieved table '${tableName}' from database '${mysqlPhysicalDb.name}' in schema '${schemaName}'`);
            return { tableName, columns };
        } catch (error: any) {
            logger.error(`Error occurred while retrieving table '${tableName}':`, error.message);
            throw new Error(`Error retrieving table '${tableName}': ${error.message}`);
        }
    }

    /**
     * Delete a specific table by name in a physical MySQL database.
     * @param user The authenticated user making the request.
     * @param dbId The database ID.
     * @param tableName The name of the table to be deleted.
     */
    static async deleteTable(user: IUser, mysqlPhysicalDb: IMySQLPhysicalDatabase, schemaName: string, tableName: string): Promise<void> {
        try {
            // Step 1: Establish a connection to the MySQL database
            const dbConnection = await DatabaseConnectionManager.connectToMySQLDatabase(mysqlPhysicalDb.connectionString + schemaName);
            if (!dbConnection) {
                throw new Error('Error establishing connection to MySQL database');
            }

            // Step 3: Execute the query to delete the table
            await dbConnection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
            logger.info(`Successfully deleted table '${tableName}' from database '${mysqlPhysicalDb.name}'`);
        } catch (error: any) {
            logger.error(`Error occurred while deleting table '${tableName}':`, error.message);
            throw new Error(`Error deleting table '${tableName}': ${error.message}`);
        }
    }
}

export default PhysicalDatabaseTableService;
