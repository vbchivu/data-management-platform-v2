import mongoose, { Schema, Document } from 'mongoose';

interface IMongoVirtualDatabase extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    dbName: string;
    createdAt: Date;
    lastUpdated: Date;
}

const MongoVirtualDatabaseSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dbName: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
});

const MongoVirtualDatabase = mongoose.model<IMongoVirtualDatabase>('MongoVirtualDatabase', MongoVirtualDatabaseSchema);
export default MongoVirtualDatabase;
export { IMongoVirtualDatabase };
