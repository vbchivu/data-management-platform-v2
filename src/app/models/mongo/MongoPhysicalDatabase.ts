import mongoose, { Schema, Document } from 'mongoose';

interface IMongoPhysicalDatabase extends Document {
    userId: mongoose.Schema.Types.ObjectId; // Reference to the user who owns the physical database
    dbName: string;
    connectionString: string; // Connection string to connect to the actual physical database
    createdAt: Date;
    lastUpdated: Date;
    dbUser: {
        username: string;
        password: string;
    }; // Store credentials
}

const MongoPhysicalDatabaseSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dbName: { type: String, required: true, unique: true },
    connectionString: { type: String, required: true },
    dbUser: {
        username: { type: String, required: true },
        password: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
});

const MongoPhysicalDatabase = mongoose.model<IMongoPhysicalDatabase>('MongoPhysicalDatabase', MongoPhysicalDatabaseSchema);
export default MongoPhysicalDatabase;
export { IMongoPhysicalDatabase };
