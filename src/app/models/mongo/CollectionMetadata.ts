import mongoose, { Schema, Document } from 'mongoose';

interface ICollectionField {
    fieldName: string;
    type: string;
    required: boolean;
    enum?: string[];
}

interface ICollectionMetadata extends Document {
    dbId: mongoose.Schema.Types.ObjectId; // References the database the collection belongs to (can be virtual or physical)
    collectionName: string;
    fields: ICollectionField[];
    useValidator: boolean;
    createdAt: Date;
    lastUpdated: Date;
}

const CollectionMetadataSchema: Schema = new Schema({
    dbId: { type: mongoose.Schema.Types.ObjectId, required: true },
    collectionName: { type: String, required: true },
    fields: [
        {
            fieldName: { type: String, required: true },
            type: { type: String, required: true, enum: ['string', 'number', 'boolean', 'date', 'enum'] },
            required: { type: Boolean, required: true },
            enum: { type: [String], required: false } // Only used when type is 'enum'
        }
    ],
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    useValidator: { type: Boolean, default: true },
});

// Export the model
const CollectionMetadata = mongoose.model<ICollectionMetadata>('CollectionMetadata', CollectionMetadataSchema);
export default CollectionMetadata;
export { ICollectionMetadata, ICollectionField };