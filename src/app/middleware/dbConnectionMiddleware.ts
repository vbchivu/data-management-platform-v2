import express from 'express';
import mongoose from 'mongoose';

const dbConnectionMiddleware: express.RequestHandler = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({ message: 'Service Unavailable. Database not connected.' });
    } else {
        next();
    }
};

export default dbConnectionMiddleware;