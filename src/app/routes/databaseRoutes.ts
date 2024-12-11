import { Router } from 'express';
import mongoDatabaseRoutes from './mongo/mongoDatabaseRoutes';
import mysqlDatabaseRoutes from './mysql/mysqlDatabaseRoutes';

const databaseRoutes = Router();

// MongoDB related routes
databaseRoutes.use('/mongo', mongoDatabaseRoutes);

// MySQL related routes
databaseRoutes.use('/mysql', mysqlDatabaseRoutes);

export default databaseRoutes;
