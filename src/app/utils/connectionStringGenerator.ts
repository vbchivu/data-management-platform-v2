import dotenv from 'dotenv';

dotenv.config();

/**
 * Generates a connection string for a physical database.
 * @param dbType The type of the database ('mongo' or 'mysql').
 * @param config The configuration parameters for the database.
 * @returns The connection string for the physical database.
 */
export const generatePhysicalDbConnectionString = (
    dbType: 'mongo' | 'mysql',
    config: {
        user: string;
        password: string;
        dbName: string;
        host?: string; // Optional host parameter for both MongoDB and MySQL
        port?: string; // Optional port parameter for both MongoDB and MySQL
    }
): string => {
    let connectionString = '';

    if (dbType === 'mongo') {
        const template = process.env.MONGO_PHYSICAL_DB_URI_TEMPLATE;
        if (!template) {
            throw new Error('MONGO_PHYSICAL_DB_URI_TEMPLATE is not defined in the environment variables.');
        }

        if (!config.user || !config.password || !config.dbName) {
            throw new Error('User, password, and dbName are required for generating MongoDB connection string.');
        }

        // Use the provided host and port or fall back to environment variables
        const host = config.host || process.env.MONGO_HOST || 'localhost';
        const port = config.port || process.env.MONGO_PORT || '27017';

        // Construct user credentials and connection string
        const userPasswordString = `${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@`;
        connectionString = `mongodb://${userPasswordString}${host}:${port}/${config.dbName}`;

    } else if (dbType === 'mysql') {
        if (!config.user || !config.password) {
            throw new Error('User, password, are required for generating MySQL connection string.');
        }

        // Use the provided host and port or fall back to environment variables
        const host = config.host || process.env.MYSQL_HOST || 'localhost';
        const port = config.port ? `:${config.port}` : `:${process.env.MYSQL_PORT || '3306'}`;

        // Construct MySQL connection string
        connectionString = `mysql://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${host}${port}/`;

    } else {
        throw new Error('Invalid database type. Must be either "mongo" or "mysql".');
    }

    return connectionString;
};