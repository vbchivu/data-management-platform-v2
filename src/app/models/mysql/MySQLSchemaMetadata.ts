import mongoose, { Schema, Document } from 'mongoose';

interface IMySQLSchemaMetadata extends Document {
    userId: mongoose.Schema.Types.ObjectId; // Reference to the user who owns the schema
    databaseId: mongoose.Schema.Types.ObjectId; // The ID of the parent physical database
    name: string; // Name of the schema
    createdAt: Date; // Timestamp for schema creation
    lastUpdated: Date; // Timestamp for the last schema modification
}

const MySQLSchemaMetadataSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    databaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'MySQLPhysicalDatabase', required: true },
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
});

const MySQLSchemaMetadata = mongoose.model<IMySQLSchemaMetadata>('MySQLSchemaMetadata', MySQLSchemaMetadataSchema);
export default MySQLSchemaMetadata;
export { IMySQLSchemaMetadata };
