import mongoose, { Schema, Document } from 'mongoose';

interface ITableField {
    fieldName: string;
    type: string; // MySQL column types (e.g., VARCHAR, INT, etc.)
    required: boolean; // Represents NOT NULL constraint
    enum?: string[]; // For ENUM types
    maxLength?: number; // For VARCHAR types
    precision?: number; // For DECIMAL types
    scale?: number; // For DECIMAL types
}

interface ITableMetadata extends Document {
    schemaId: mongoose.Schema.Types.ObjectId; // References the schema the table belongs to
    tableName: string;
    fields: ITableField[];
    useValidator: boolean; // Indicates whether validation should be applied for records
    createdAt: Date;
    lastUpdated: Date;
}

const TableMetadataSchema: Schema = new Schema({
    schemaId: { type: mongoose.Schema.Types.ObjectId, ref: 'SchemaMetadata', required: true },
    tableName: { type: String, required: true },
    fields: [
        {
            fieldName: { type: String, required: true },
            type: { type: String, required: true }, // No strict enum, flexible for MySQL types
            required: { type: Boolean, required: true },
            primaryKey: { type: Boolean, default: false },
            autoIncrement: { type: Boolean, default: false },
            enum: { type: [String], required: false }, // Optional for ENUM types
        },
    ],
    useValidator: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
});

// Export the model
const TableMetadata = mongoose.model<ITableMetadata>('TableMetadata', TableMetadataSchema);
export default TableMetadata;
export { ITableMetadata, ITableField };
