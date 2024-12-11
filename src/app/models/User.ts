import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Separate export of IUser interface
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    comparePassword: (password: string) => Promise<boolean>;
    mysqlCredentials?: {
        dbName: string;
        username: string;
        password: string;
    }[];
    mongoCredentials?: {
        dbName: string;
        username: string;
        password: string;
    }[];
}

// Casting the correct type for the 'pre' hook function
interface IUserModel extends IUser {
    password: string; // Assert that password is a string here
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    mysqlCredentials: [
        {
            dbName: { type: String, required: true },
            username: { type: String, required: true },
            password: { type: String, required: true }, // Store hashed password
        }
    ],
    mongoCredentials: [
        {
            dbName: { type: String, required: true },
            username: { type: String, required: true },
            password: { type: String, required: true }, // Store hashed password
        }
    ],
});

// Pre-save hook for hashing the password
UserSchema.pre<IUserModel>('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Method for comparing password
UserSchema.methods.comparePassword = function (password: string) {
    return bcrypt.compare(password, this.password);
};

// Default export of the User model
const User = mongoose.model<IUser>('User', UserSchema);
export default User;
