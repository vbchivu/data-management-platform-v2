import express from 'express';
import dotenv from 'dotenv';
import { initializeAppDatabase } from './config/mongoDB';
import databaseRoutes from './app/routes/databaseRoutes';
import authRoutes from './app/routes/authRoutes';
import helmet from 'helmet';
import passport from './config/passportConfig';
import cors from 'cors';
import { authenticateJWT } from './app/middleware/authMiddleware';
import { morganMiddleware, winstonLoggerMiddleware } from './app/middleware/loggerMiddleware';
import logger from './config/winstonLogger';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import dbConnectionMiddleware from './app/middleware/dbConnectionMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet()); // Security headers
app.use(express.json());
app.use(morganMiddleware); // Log requests using Morgan
app.use(winstonLoggerMiddleware); // Log requests using Winston for more information
app.use(passport.initialize());

// MongoDB Connection (Skip connection if in test environment)
if (process.env.NODE_ENV !== 'test') {
    initializeAppDatabase()
        .then(() => {
            logger.info('Connected to MongoDB successfully.'); // Log connection success
            app.listen(PORT, () => {
                logger.info(`Server running on http://localhost:${PORT}`);
            });
        })
        .catch((err: { message: any; }) => {
            logger.error('Failed to connect to MongoDB:', err.message);
            process.exit(1); // Only exit if not in a test environment
        });
} else {
    logger.warn('Skipping MongoDB connection for test environment.');
}

// Use the middleware in your app
app.use(dbConnectionMiddleware);

// Load Swagger file
const swaggerDocument = YAML.load('./swagger.yaml');
// Use Swagger UI middleware
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Authentication Routes
app.use('/auth', authRoutes);

// Protected API Routes
const apiRouter = express.Router();
apiRouter.use(authenticateJWT);
apiRouter.use(databaseRoutes);
app.use('/api/v1', apiRouter);

export default app;
