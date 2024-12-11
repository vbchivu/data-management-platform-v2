import mongoose, { Schema, Document } from 'mongoose';

interface IRecordMetadata extends Document {
    schemaId: mongoose.Schema.Types.ObjectId; // References the schema
    tableId: mongoose.Schema.Types.ObjectId; // References the table
    data: any; // Holds the actual record data
    createdAt: Date;
    lastUpdated: Date;
}

const RecordMetadataSchema: Schema = new Schema({
    schemaId: { type: mongoose.Schema.Types.ObjectId, ref: 'SchemaMetadata', required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'TableMetadata', required: true },
    data: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
});

const RecordMetadata = mongoose.model<IRecordMetadata>('RecordMetadata', RecordMetadataSchema);
export default RecordMetadata;
export { IRecordMetadata };
