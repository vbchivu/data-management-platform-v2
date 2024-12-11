import { ICollectionField } from '../models/mongo/CollectionMetadata';
import { ITableField } from '../models/mysql/TableMetadata';
import Joi from 'joi';

export const validateRecordAgainstMongoSchema = (record: any, fields: ICollectionField[]) => {
    for (const field of fields) {
        const value = record[field.fieldName];

        // Check if the field is required but missing
        if (field.required && value === undefined) {
            throw new Error(`Field '${field.fieldName}' is required.`);
        }

        // Check type enforcement
        if (value !== undefined) {
            switch (field.type) {
                case 'string':
                    if (typeof value !== 'string') {
                        throw new Error(`Field '${field.fieldName}' must be a string.`);
                    }
                    break;
                case 'number':
                    if (typeof value !== 'number') {
                        throw new Error(`Field '${field.fieldName}' must be a number.`);
                    }
                    break;
                case 'boolean':
                    if (typeof value !== 'boolean') {
                        throw new Error(`Field '${field.fieldName}' must be a boolean.`);
                    }
                    break;
                case 'date':
                    if (isNaN(Date.parse(value))) {
                        throw new Error(`Field '${field.fieldName}' must be a valid date.`);
                    }
                    break;
                case 'enum':
                    if (field.enum && !field.enum.includes(value)) {
                        throw new Error(`Field '${field.fieldName}' must be one of: ${field.enum.join(', ')}`);
                    }
                    break;
                default:
                    throw new Error(`Invalid field type for '${field.fieldName}'`);
            }
        }
    }
};

export const validateRecordAgainstMySQLSchema = (record: any, fields: ITableField[]) => {
    for (const field of fields) {
        const value = record[field.fieldName];

        // Check if the field is required but missing
        if (field.required && value === undefined) {
            throw new Error(`Field '${field.fieldName}' is required.`);
        }

        // If the field has a value, validate its type and constraints
        if (value !== undefined) {
            switch (field.type.toUpperCase()) {
                case 'VARCHAR':
                case 'TEXT':
                    if (typeof value !== 'string') {
                        throw new Error(`Field '${field.fieldName}' must be a string.`);
                    }
                    if (field.maxLength && value.length > field.maxLength) {
                        throw new Error(`Field '${field.fieldName}' must not exceed ${field.maxLength} characters.`);
                    }
                    break;

                case 'INT':
                case 'BIGINT':
                case 'TINYINT':
                case 'SMALLINT':
                case 'MEDIUMINT':
                    if (typeof value !== 'number' || !Number.isInteger(value)) {
                        throw new Error(`Field '${field.fieldName}' must be an integer.`);
                    }
                    break;

                case 'DECIMAL':
                case 'FLOAT':
                case 'DOUBLE':
                    if (typeof value !== 'number') {
                        throw new Error(`Field '${field.fieldName}' must be a number.`);
                    }
                    if (field.precision && field.scale) {
                        const [intPart, decPart] = value.toString().split('.');
                        if (intPart.length > field.precision - field.scale) {
                            throw new Error(
                                `Field '${field.fieldName}' integer part exceeds precision minus scale (${field.precision - field.scale}).`
                            );
                        }
                        if (decPart?.length > field.scale) {
                            throw new Error(
                                `Field '${field.fieldName}' fractional part exceeds scale (${field.scale}).`
                            );
                        }
                    }
                    break;

                case 'BOOLEAN':
                    if (typeof value !== 'boolean') {
                        throw new Error(`Field '${field.fieldName}' must be a boolean.`);
                    }
                    break;

                case 'DATE':
                case 'DATETIME':
                case 'TIMESTAMP':
                    if (isNaN(Date.parse(value))) {
                        throw new Error(`Field '${field.fieldName}' must be a valid date.`);
                    }
                    break;

                case 'ENUM':
                    if (field.enum && !field.enum.includes(value)) {
                        throw new Error(`Field '${field.fieldName}' must be one of: ${field.enum.join(', ')}`);
                    }
                    break;

                default:
                    throw new Error(`Unsupported field type '${field.type}' for '${field.fieldName}'.`);
            }
        }
    }
}

export const validateDatabaseCreation = (dbName: string) => {
    const schema = Joi.string().min(3).max(30).required();
    const { error } = schema.validate(dbName);
    if (error) {
        throw new Error(error.details[0].message);
    }
};