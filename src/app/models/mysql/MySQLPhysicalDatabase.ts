import mongoose, { Schema, Document } from 'mongoose';

interface IMySQLPhysicalDatabase extends Document {
    userId: mongoose.Schema.Types.ObjectId; // Reference to the user who owns the physical database
    name: string; // Name of the physical database
    defaultSchema: string;
    connectionString: string; // Connection string to connect to the actual physical database
    createdAt: Date;
    dbUser: {
        username: string;
        password: string;
    }; // Store credentials
    otherSchemas: string[]; // Store other schemas in the physical database
}

const MySQLPhysicalDatabaseSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    defaultSchema: { type: String, required: true, unique: true },
    connectionString: { type: String, required: true },
    dbUser: {
        username: { type: String, required: true },
        password: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
    otherSchemas: { type: [String], default: [] },
});

const MySQLPhysicalDatabase = mongoose.model<IMySQLPhysicalDatabase>('MySQLPhysicalDatabase', MySQLPhysicalDatabaseSchema);
export default MySQLPhysicalDatabase;
export { IMySQLPhysicalDatabase };
