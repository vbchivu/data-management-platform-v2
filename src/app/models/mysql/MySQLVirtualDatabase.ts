import mongoose, { Schema, Document } from 'mongoose';

interface IMySQLVirtualDatabase extends Document {
    userId: mongoose.Schema.Types.ObjectId; // Reference to the user who owns the virtual MySQL database (schema)
    parentPhysicalDbId: mongoose.Schema.Types.ObjectId; // The ID of the parent physical database
    schemaName: string;
    createdAt: Date;
}

const MySQLVirtualDatabaseSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parentPhysicalDbId: { type: mongoose.Schema.Types.ObjectId, ref: 'MySQLPhysicalDatabase', required: true },
    schemaName: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
});

const MySQLVirtualDatabase = mongoose.model<IMySQLVirtualDatabase>('MySQLVirtualDatabase', MySQLVirtualDatabaseSchema);
export default MySQLVirtualDatabase;
export { IMySQLVirtualDatabase };