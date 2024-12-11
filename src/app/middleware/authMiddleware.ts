import { RequestHandler } from 'express';
import passport from 'passport';

// Middleware to protect routes
export const authenticateJWT: RequestHandler = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err: any, user: Express.User | undefined, info: any) => {
        if (err || !user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;
        next();
    })(req, res, next);
};
