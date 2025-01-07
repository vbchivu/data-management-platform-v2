import mongoose, { ConnectOptions, Connection } from 'mongoose';
import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';
import retry from 'async-retry';
import logger from '../../config/winstonLogger';
import url from 'url';

dotenv.config();
class DatabaseConnectionManager {
    private static appConnection: Connection | null = null;
    private static physicalConnections: Map<string, Connection> = new Map();
    private static mysqlConnections: Map<string, Pool> = new Map();
    private static adminConnections: Map<string, Connection> = new Map(); // Map to track admin connections per MongoDB

    /**
     * Connect to the main application MongoDB instance using mongoose.connect to track the default connection state.
     */
    public static async connectToAppDatabase(): Promise<void> {
        if (mongoose.connection.readyState === 1) {
            logger.info('Already connected to Application MongoDB.');
            return;
        }

        try {
            await retry(async () => {
                const options: ConnectOptions = {};
                await mongoose.connect(process.env.MONGO_APP_URI as string, options);
                logger.info('Connected to Application MongoDB successfully.');
                DatabaseConnectionManager.appConnection = mongoose.connection; // Track the default connection
            }, {
                retries: 5,
                minTimeout: 1000,
                onRetry: (err, attempt) => {
                    logger.warn(`Retrying connection to Application MongoDB: Attempt ${attempt}`);
                },
            });
        } catch (err) {
            logger.error('Error connecting to Application MongoDB: ', (err as Error).message);
            throw err;
        }
    }

    /**
     * Get the application database connection.
     */
    public static getAppConnection(): Connection {
        if (!DatabaseConnectionManager.appConnection || mongoose.connection.readyState !== 1) {
            throw new Error('Application database connection has not been established.');
        }
        return DatabaseConnectionManager.appConnection;
    }

    /**
     * Connect as admin to a specified MongoDB database (targeted for administrative purposes).
     * This connection will be used to perform admin-level actions, such as creating users.
     * @param dbName The name of the target database.
     */
    public static async connectAsAdminToDatabase(dbName: string): Promise<Connection> {
        if (DatabaseConnectionManager.adminConnections.has(dbName)) {
            const existingConnection = DatabaseConnectionManager.adminConnections.get(dbName);
            if (existingConnection?.readyState === 1) {
                logger.info(`Reusing existing admin connection to MongoDB database '${dbName}'.`);
                return existingConnection;
            }
        }

        try {
            return await retry(async () => {
                const options: ConnectOptions = {};
                const adminUri = process.env.MONGO_ADMIN_URI?.replace('{dbName}', dbName) as string;

                const connection = mongoose.createConnection(adminUri, options);
                await connection.asPromise();
                logger.info(`Connected as admin to MongoDB database '${dbName}' successfully.`);

                DatabaseConnectionManager.adminConnections.set(dbName, connection);
                return connection;
            }, {
                retries: 5,
                minTimeout: 1000,
                onRetry: (err, attempt) => {
                    logger.warn(`Retrying connection as admin to MongoDB database '${dbName}': Attempt ${attempt}`);
                },
            });
        } catch (err) {
            logger.error(`Error connecting as admin to MongoDB database '${dbName}': `, (err as Error).message);
            throw err;
        }
    }

    /**
     * Connect to a physical MongoDB database using the provided connection string.
     * Uses a cached connection if one already exists for the given connection string.
     * @param connectionString The connection string for the physical database.
     */
    public static async connectToPhysicalMongoDB(connectionString: string): Promise<Connection> {
        if (DatabaseConnectionManager.physicalConnections.has(connectionString)) {
            const existingConnection = DatabaseConnectionManager.physicalConnections.get(connectionString);
            if (existingConnection?.readyState === 1) {
                logger.info(`Reusing existing connection to Physical MongoDB Database: ${connectionString}`);
                return existingConnection;
            }
        }

        try {
            return await retry(async () => {
                const options: ConnectOptions = {};
                const connection = mongoose.createConnection(connectionString, options);
                await connection.asPromise();
                logger.info(`Connected to Physical MongoDB Database with connection string: ${connectionString}`);

                DatabaseConnectionManager.physicalConnections.set(connectionString, connection);
                return connection;
            }, {
                retries: 3,
                minTimeout: 1000,
                onRetry: (err, attempt) => {
                    logger.warn(`Retrying connection to Physical MongoDB Database: Attempt ${attempt}`);
                },
            });
        } catch (err) {
            logger.error('Error connecting to Physical MongoDB Database: ', (err as Error).message);
            throw err;
        }
    }

    /**
     * Connect to a physical MySQL database or reuse the existing connection pool.
     * @param config The connection configuration for the physical MySQL database.
     */
    /**
     * Connect to a physical MySQL database or reuse the existing connection pool.
     * @param connectionString The connection string for the MySQL database.
     */
    public static async connectToMySQLDatabase(connectionString: string): Promise<Pool> {
        try {
            const parsedUrl = new url.URL(connectionString);
            if (!parsedUrl.username || !parsedUrl.password || !parsedUrl.pathname) {
                throw new Error('Invalid MySQL connection string format. Ensure the format includes user, password, and database.');
            }

            const user = parsedUrl.username;
            const password = parsedUrl.password;
            const host = parsedUrl.hostname;
            const port = parsedUrl.port ? Number(parsedUrl.port) : 3306;
            const database = parsedUrl.pathname.substring(1); // Remove leading '/' from pathname to get database name
            const connectionKey = `${user}:${process.env.MYSQL_HOST}:${database}`;
            if (DatabaseConnectionManager.mysqlConnections.has(connectionKey)) {
                logger.info(`Reusing existing connection to MySQL database: ${connectionKey}`);
                return DatabaseConnectionManager.mysqlConnections.get(connectionKey) as Pool;
            }

            const pool = await retry(async () => {
                return mysql.createPool({
                    host,
                    port,
                    user,
                    password,
                    database,
                    connectionLimit: 10, // Maximum number of connections in the pool
                });
            }, {
                retries: 3,
                minTimeout: 1000,
                onRetry: (err, attempt) => {
                    logger.warn(`Retrying connection to MySQL database: Attempt ${attempt}`);
                },
            });

            logger.info(`Connected to MySQL database with connection string: ${connectionString}`);
            DatabaseConnectionManager.mysqlConnections.set(connectionKey, pool);
            return pool;
        } catch (err) {
            logger.error('Error connecting to MySQL database: ', (err as Error).message);
            throw err;
        }
    }

    /**
     * Connect as an admin to MySQL database (for administrative purposes).
     * This connection is used to perform admin-level actions, such as creating users or databases.
     */
    public static async connectAsAdminToMySQLDatabase(database?: string): Promise<Pool> {
        try {
            if (database) {
                const connectionKey = `admin:${process.env.MYSQL_HOST}:${database}`;
                if (DatabaseConnectionManager.mysqlConnections.has(connectionKey)) {
                    logger.info(`Reusing existing admin connection to MySQL database: ${connectionKey}`);
                    return DatabaseConnectionManager.mysqlConnections.get(connectionKey) as Pool;
                }

                const pool = mysql.createPool({
                    host: process.env.MYSQL_HOST,
                    port: Number(process.env.MYSQL_PORT) || 3306, // Default to 3306 if MYSQL_PORT not defined
                    user: 'root',
                    password: process.env.MYSQL_ROOT_PASSWORD,
                    database,
                    connectionLimit: 10, // Maximum number of connections in the pool
                });

                logger.info(`Connected as admin to MySQL database on host: ${process.env.MYSQL_HOST}, database: ${database}`);
                DatabaseConnectionManager.mysqlConnections.set(connectionKey, pool);
                return pool;
            } else {
                const connectionKey = `admin:${process.env.MYSQL_HOST}`;
                if (DatabaseConnectionManager.mysqlConnections.has(connectionKey)) {
                    logger.info(`Reusing existing admin connection to MySQL database on host: ${process.env.MYSQL_HOST}`);
                    return DatabaseConnectionManager.mysqlConnections.get(connectionKey) as Pool;
                }

                const pool = mysql.createPool({
                    host: process.env.MYSQL_HOST,
                    port: Number(process.env.MYSQL_PORT) || 3306,
                    user: 'root',
                    password: process.env.MYSQL_ROOT_PASSWORD,
                    connectionLimit: 10, // Maximum number of connections in the pool
                });

                logger.info(`Connected as admin to MySQL database on host: ${process.env.MYSQL_HOST}`);
                DatabaseConnectionManager.mysqlConnections.set(connectionKey, pool);
                return pool;
            }
        } catch (err) {
            logger.error('Error connecting as admin to MySQL database: ', (err as Error).message);
            throw err;
        }
    }

    // Separate disconnect functions for each connection type

    /**
     * Disconnect from the main application MongoDB instance.
     */
    public static async disconnectAppDatabase(): Promise<void> {
        if (DatabaseConnectionManager.appConnection) {
            await DatabaseConnectionManager.appConnection.close();
            logger.info('Disconnected from Application MongoDB.');
            DatabaseConnectionManager.appConnection = null;
        }
    }

    /**
     * Disconnect a specific physical MongoDB connection.
     * @param connectionString The connection string of the physical database to disconnect.
     */
    public static async disconnectPhysicalMongoDB(connectionString: string): Promise<void> {
        if (DatabaseConnectionManager.physicalConnections.has(connectionString)) {
            const connection = DatabaseConnectionManager.physicalConnections.get(connectionString);
            if (connection) {
                await connection.close();
                logger.info(`Disconnected from Physical MongoDB Database: ${connectionString}`);
                DatabaseConnectionManager.physicalConnections.delete(connectionString);
            }
        }
    }

    /**
     * Disconnect a specific admin connection to a MongoDB database.
     * @param dbName The name of the target database.
     */
    public static async disconnectAdminConnection(dbName: string): Promise<void> {
        if (DatabaseConnectionManager.adminConnections.has(dbName)) {
            const connection = DatabaseConnectionManager.adminConnections.get(dbName);
            if (connection) {
                await connection.close();
                logger.info(`Disconnected from admin connection to MongoDB database '${dbName}'`);
                DatabaseConnectionManager.adminConnections.delete(dbName);
            }
        }
    }

    /**
     * Disconnect a specific MySQL database connection.
     * @param config The connection configuration of the MySQL database to disconnect.
     */
    public static async disconnectMySQLDatabase(config: {
        host: string;
        database: string;
    }): Promise<void> {
        const connectionKey = `${config.host}:${config.database}`;

        if (DatabaseConnectionManager.mysqlConnections.has(connectionKey)) {
            const pool = DatabaseConnectionManager.mysqlConnections.get(connectionKey);
            if (pool) {
                await pool.end();
                logger.info(`Disconnected from MySQL Database: ${connectionKey}`);
                DatabaseConnectionManager.mysqlConnections.delete(connectionKey);
            }
        }
    }

    /**
     * Disconnect the MySQL admin connection.
     * @param database The database to disconnect from (defaults to 'mysql').
     */
    public static async disconnectAdminMySQLDatabase(database: string = 'mysql'): Promise<void> {
        const connectionKey = `admin:${process.env.MYSQL_HOST}:${database}`;

        if (DatabaseConnectionManager.mysqlConnections.has(connectionKey)) {
            const pool = DatabaseConnectionManager.mysqlConnections.get(connectionKey);
            if (pool) {
                await pool.end();
                logger.info(`Disconnected from MySQL admin connection on host: ${process.env.MYSQL_HOST}, database: ${database}`);
                DatabaseConnectionManager.mysqlConnections.delete(connectionKey);
            }
        }
    }

    /**
     * Disconnect all database connections, mainly used during shutdown.
     */
    public static async disconnectAll(): Promise<void> {
        await DatabaseConnectionManager.disconnectAppDatabase();

        for (const [connectionString, connection] of DatabaseConnectionManager.physicalConnections) {
            await connection.close();
            logger.info(`Disconnected from Physical MongoDB Database: ${connectionString}`);
        }
        DatabaseConnectionManager.physicalConnections.clear();

        for (const [dbName, connection] of DatabaseConnectionManager.adminConnections) {
            await connection.close();
            logger.info(`Disconnected from admin connection to MongoDB database '${dbName}'`);
        }
        DatabaseConnectionManager.adminConnections.clear();

        for (const [connectionKey, pool] of DatabaseConnectionManager.mysqlConnections) {
            await pool.end();
            logger.info(`Disconnected from MySQL Database: ${connectionKey}`);
        }
        DatabaseConnectionManager.mysqlConnections.clear();
    }
}

export default DatabaseConnectionManager;
