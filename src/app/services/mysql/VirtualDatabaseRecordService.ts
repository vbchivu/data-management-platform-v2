import { IUser } from '../../models/User';
import DatabaseConnectionManager from '../../services/DatabaseConnectionManager';
import { RowDataPacket } from 'mysql2/promise';
import logger from '../../../config/winstonLogger';
import { IMySQLVirtualDatabase } from '../../models/mysql/MySQLVirtualDatabase';

class VirtualDatabaseRecordService {
    // Create a new record
    static async createRecord(user: IUser, mysqlVirtualDb: IMySQLVirtualDatabase, tableName: string, record: any): Promise<any> {
        try {
            const dbConnection = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase(mysqlVirtualDb.schemaName);
            if (!dbConnection) {
                throw new Error('Error connecting to MySQL virtual database.');
            }

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
        mysqlVirtualDb: IMySQLVirtualDatabase,
        tableName: string,
        page: number,
        limit: number,
        filters: Record<string, any>
    ): Promise<{ records: any[]; total: number; page: number; limit: number }> {
        try {
            const dbConnection = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase(mysqlVirtualDb.schemaName);
            if (!dbConnection) {
                throw new Error('Error connecting to MySQL virtual database.');
            }

            // Step 3: Construct the base query and apply filters
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

            // Step 4: Execute the query with filters, limit, and offset
            const [records] = await dbConnection.query<RowDataPacket[]>(query, [...filterValues, limit, offset]);

            // Step 5: Get the total count of records for pagination
            const countQuery = `
                SELECT COUNT(*) as total FROM \`${tableName}\`
                ${whereClause}
            `;
            const [countResult] = await dbConnection.query(countQuery, filterValues);
            const total = (countResult as RowDataPacket[])[0]?.total || 0;

            logger.info(`Retrieved ${(records as RowDataPacket[]).length} records from table '${tableName}' in database '${mysqlVirtualDb.schemaName}'`);

            return { records, total, page, limit };
        } catch (error: any) {
            logger.error(`Error retrieving records from table '${tableName}':`, error.message);
            throw new Error(`Error retrieving records from table '${tableName}': ${error.message}`);
        }
    }

    // Get a specific record by ID
    static async getRecord(user: IUser, mysqlVirtualDb: IMySQLVirtualDatabase, tableName: string, recordId: string): Promise<any> {
        try {
            const dbConnection = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase(mysqlVirtualDb.schemaName);
            if (!dbConnection) {
                throw new Error('Error connecting to MySQL virtual database.');
            }

            const selectQuery = `SELECT * FROM \`${tableName}\` WHERE id = ?`;
            const [rows] = await dbConnection.execute(selectQuery, [recordId]);

            return (rows as RowDataPacket[])[0];
        } catch (error: any) {
            throw new Error(`Error fetching record from table '${tableName}': ${error.message}`);
        }
    }

    // Update a specific record by ID
    static async updateRecord(user: IUser, mysqlVirtualDb: IMySQLVirtualDatabase, tableName: string, recordId: string, updatedData: any): Promise<any> {
        try {
            const dbConnection = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase(mysqlVirtualDb.schemaName);
            if (!dbConnection) {
                throw new Error('Error connecting to MySQL virtual database.');
            }

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
    static async deleteRecord(user: IUser, mysqlVirtualDb: IMySQLVirtualDatabase, tableName: string, recordId: string): Promise<void> {
        try {
            const dbConnection = await DatabaseConnectionManager.connectAsAdminToMySQLDatabase(mysqlVirtualDb.schemaName);
            if (!dbConnection) {
                throw new Error('Error connecting to MySQL virtual database.');
            }

            const deleteQuery = `DELETE FROM \`${tableName}\` WHERE id = ?`;
            await dbConnection.execute(deleteQuery, [recordId]);

            return;
        } catch (error: any) {
            throw new Error(`Error deleting record from table '${tableName}': ${error.message}`);
        }
    }
}

export default VirtualDatabaseRecordService;
