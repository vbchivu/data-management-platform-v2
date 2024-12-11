import { IUser } from '../../models/User';
import DatabaseConnectionManager from '../../services/DatabaseConnectionManager';
import { RowDataPacket } from 'mysql2/promise';
import logger from '../../../config/winstonLogger';

class PhysicalDatabaseRecordService {
    // Create a new record
    static async createRecord(user: IUser, mysqlPhysicalDb: any, schemaName: string, tableName: string, record: any): Promise<any> {
        try {
            // Step 1: Establish a connection to the MySQL database
            const dbConnection = await DatabaseConnectionManager.connectToMySQLDatabase(mysqlPhysicalDb.connectionString + schemaName);
            if (!dbConnection) {
                throw new Error('Error establishing connection to MySQL database');
            }

            // Step 2: Insert the new record into the specified table
            const columns = Object.keys(record).map(col => `\`${col}\``).join(', ');
            const values = Object.values(record);
            const placeholders = values.map(() => '?').join(', ');

            const insertQuery = `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`;
            const [result] = await dbConnection.execute(insertQuery, values);

            return { id: (result as any).insertId, ...record };
        } catch (error: any) {
            throw new Error(`Error creating record in table '${tableName}': ${error.message}`);
        }
    }

    /**
     * Get all records from a table with optional pagination and filtering.
     * @param user User requesting the data.
     * @param dbId Database ID.
     * @param tableName Table name.
     * @param page Current page for pagination.
     * @param limit Number of records per page.
     * @param filters Query parameters for filtering records.
     */
    static async getAllRecords(
        user: IUser,
        mysqlPhysicalDb: any,
        schemaName: string,
        tableName: string,
        page: number,
        limit: number,
        filters: Record<string, any>
    ): Promise<{ records: any[]; total: number; page: number; limit: number }> {
        try {
            // Step 1: Retrieve the database details from our metadata store
            const dbConnection = await DatabaseConnectionManager.connectToMySQLDatabase(mysqlPhysicalDb.connectionString + schemaName);
            if (!dbConnection) {
                throw new Error('Error establishing connection to MySQL database');
            }

            // Step 2: Construct the base query and apply filters
            let whereClause = '';
            const filterValues: any[] = [];
            if (filters) {
                const conditions = Object.entries(filters).map(([key, value]) => {
                    filterValues.push(value);
                    return `\`${key}\` = ?`;
                });
                whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            }

            const offset = (page - 1) * limit;
            const query = `
                SELECT * FROM \`${tableName}\` 
                ${whereClause}
                LIMIT ? OFFSET ?
            `;

            // Step 3: Execute the query with filters, limit, and offset
            const [records] = await dbConnection.query<RowDataPacket[]>(query, [...filterValues, limit, offset]);

            // Step 4: Get the total count of records for pagination
            const countQuery = `
                SELECT COUNT(*) as total FROM \`${tableName}\`
                ${whereClause}
            `;
            const [countResult] = await dbConnection.query(countQuery, filterValues);
            const total = (countResult as RowDataPacket[])[0]?.total || 0;

            logger.info(`Retrieved ${(records as RowDataPacket[]).length} records from table '${tableName}' in database '${mysqlPhysicalDb.name}'`);

            return { records, total, page, limit };
        } catch (error: any) {
            logger.error(`Error retrieving records from table '${tableName}':`, error.message);
            throw new Error(`Error retrieving records from table '${tableName}': ${error.message}`);
        }
    }

    // Get a specific record by ID
    static async getRecord(user: IUser, mysqlPhysicalDb: any, schemaName: string, tableName: string, recordId: string): Promise<any> {
        try {
            // Step 1: Retrieve the database details from our metadata store
            const dbConnection = await DatabaseConnectionManager.connectToMySQLDatabase(mysqlPhysicalDb.connectionString + schemaName);

            // Step 2: Fetch the record by ID
            const selectQuery = `SELECT * FROM \`${tableName}\` WHERE id = ?`;
            const [rows] = await dbConnection.execute(selectQuery, [recordId]);

            return (rows as RowDataPacket[])[0];
        } catch (error: any) {
            throw new Error(`Error fetching record from table '${tableName}': ${error.message}`);
        }
    }

    // Update a specific record by ID
    static async updateRecord(user: IUser, mysqlPhysicalDb: any, schemaName: string, tableName: string, recordId: string, updatedData: any): Promise<any> {
        try {
            // Step 1: Retrieve the database details from our metadata store
            const dbConnection = await DatabaseConnectionManager.connectToMySQLDatabase(mysqlPhysicalDb.connectionString + schemaName);

            // Step 2: Update the record by ID
            const setClauses = Object.keys(updatedData).map(col => `\`${col}\` = ?`).join(', ');
            const values = Object.values(updatedData);
            const updateQuery = `UPDATE \`${tableName}\` SET ${setClauses} WHERE id = ?`;

            await dbConnection.execute(updateQuery, [...values, recordId]);
            return { id: recordId, ...updatedData };
        } catch (error: any) {
            throw new Error(`Error updating record in table '${tableName}': ${error.message}`);
        }
    }

    // Delete a specific record by ID
    static async deleteRecord(user: IUser, mysqlPhysicalDb: any, schemaName: string, tableName: string, recordId: string): Promise<void> {
        try {
            // Step 1: Retrieve the database details from our metadata store
            const dbConnection = await DatabaseConnectionManager.connectToMySQLDatabase(mysqlPhysicalDb.connectionString + schemaName);

            // Step 2: Delete the record by ID
            const deleteQuery = `DELETE FROM \`${tableName}\` WHERE id = ?`;
            await dbConnection.execute(deleteQuery, [recordId]);

            return;
        } catch (error: any) {
            throw new Error(`Error deleting record from table '${tableName}': ${error.message}`);
        }
    }
}

export default PhysicalDatabaseRecordService;
