import { Request } from 'express';
import { IUser } from '@src/app/models/User';
import { IMongoPhysicalDatabase } from '@src/app/models/mongo/MongoPhysicalDatabase';
import { IMongoVirtualDatabase } from '@src/app/models/mongo/MongoVirtualDatabase';
import { IMySQLPhysicalDatabase } from '@src/app/models/mysql/MySQLPhysicalDatabase';
import { IMySQLVirtualDatabase } from '@src/app/models/mysql/MySQLVirtualDatabase';

export interface AuthenticatedRequest extends Request {
    user?: IUser;  // User information
    mongoPhysicalDb?: IMongoPhysicalDatabase; // Mongo Physical Database information
    mongoVirtualDb?: IMongoVirtualDatabase;   // Mongo Virtual Database information
    mysqlVirtualDb?: IMySQLVirtualDatabase;   // MySQL Virtual Database information
    mysqlPhysicalDb?: IMySQLPhysicalDatabase;   // MySQL Virtual Database information
}
