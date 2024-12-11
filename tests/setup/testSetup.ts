import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' }); // Load environment variables from .env.test

let isConnected = false;

jest.setTimeout(30000); // Increase Jest timeout to 30 seconds

beforeAll(async () => {
    if (!process.env.TEST_MONGO_URI) {
        throw new Error('TEST_MONGO_URI is not defined. Please define it in the .env.test file.');
    }

    // Only connect if there's no active connection
    if (!isConnected) {
        await mongoose.connect(process.env.TEST_MONGO_URI);
        isConnected = true;
    }
});

afterEach(async () => {
    // Clean up all collections after each test to keep data isolated
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

afterAll(async () => {
    if (isConnected) {
        // Close the database connection after all tests
        await mongoose.connection.close();
        isConnected = false;
    }
});

// Mock process.exit to avoid stopping tests
jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
    throw new Error(`process.exit was called with code: ${code}`);
});
