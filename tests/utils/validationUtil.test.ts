import { validateRecordAgainstMongoSchema } from '@utils/validationUtil';
import { ICollectionField } from '@src/app/models/mongo/CollectionMetadata';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' }); // Load environment variables from .env.test

describe('validateRecordAgainstMongoSchema', () => {
    beforeAll(async () => {
        if (!process.env.TEST_MONGO_URI) {
            throw new Error('TEST_MONGO_URI is not defined. Please define it in the .env.test file.');
        }
        // Connect to a test MongoDB instance
        await mongoose.connect(process.env.TEST_MONGO_URI);
    });

    afterAll(async () => {
        // Close the database connection after all tests
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    const schema: ICollectionField[] = [
        { fieldName: 'name', type: 'string', required: true },
        { fieldName: 'age', type: 'number', required: true },
        { fieldName: 'email', type: 'string', required: false },
        { fieldName: 'status', type: 'enum', required: true, enum: ['active', 'inactive'] },
    ];

    it('should validate a correct record', () => {
        const record = {
            name: 'John Doe',
            age: 30,
            status: 'active',
        };

        expect(() => validateRecordAgainstMongoSchema(record, schema)).not.toThrow();
    });

    it('should throw an error if a required field is missing', () => {
        const record = {
            age: 30,
            status: 'active',
        };

        expect(() => validateRecordAgainstMongoSchema(record, schema)).toThrow("Field 'name' is required.");
    });

    it('should throw an error if the data type is incorrect', () => {
        const record = {
            name: 'John Doe',
            age: 'thirty', // Incorrect data type
            status: 'active',
        };

        expect(() => validateRecordAgainstMongoSchema(record, schema)).toThrow("Field 'age' must be a number.");
    });

    it('should throw an error if enum value is invalid', () => {
        const record = {
            name: 'John Doe',
            age: 30,
            status: 'pending', // Not an allowed enum value
        };

        expect(() => validateRecordAgainstMongoSchema(record, schema)).toThrow("Field 'status' must be one of: active, inactive");
    });
});
