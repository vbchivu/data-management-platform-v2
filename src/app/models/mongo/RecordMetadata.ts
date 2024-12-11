import mongoose, { Schema, Document } from 'mongoose';

interface IRecordMetadata extends Document {
    dbId: mongoose.Schema.Types.ObjectId; // References the database the collection belongs to (can be physical or virtual)
    collectionId: mongoose.Schema.Types.ObjectId; // References the collection
    data: any; // Holds the data of the record, structure is defined by collection fields
    createdAt: Date;
    lastUpdated: Date;
}

const RecordMetadataSchema: Schema = new Schema({
    dbId: { type: mongoose.Schema.Types.ObjectId, required: true },
    collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionMetadata', required: true },
    data: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
});

const RecordMetadata = mongoose.model<IRecordMetadata>('RecordMetadata', RecordMetadataSchema);
export default RecordMetadata;
export { IRecordMetadata };
