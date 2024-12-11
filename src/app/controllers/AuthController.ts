import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import dotenv from 'dotenv';

dotenv.config();

class AuthController {
    /**
     * Register a new user
     */
    static async registerUser(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { username, email, password } = req.body;

        try {
            // Create a new user; password will be hashed by the pre-save hook
            const user = new User({ username, email, password });
            await user.save();
            res.status(201).json({ message: 'User registered successfully' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error registering user', error: error.message });
        }
    }

    /**
     * Login a user
     */
    static async loginUser(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email });
            if (!user) {
                res.status(400).json({ message: 'Invalid credentials' });
                return;
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                res.status(400).json({ message: 'Invalid credentials' });
                return;
            }

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
                expiresIn: process.env.JWT_EXPIRY || '1h',
            });

            res.status(200).json({ token });
        } catch (error: any) {
            res.status(500).json({ message: 'Error logging in user', error: error.message });
        }
    }
}

export default AuthController;
