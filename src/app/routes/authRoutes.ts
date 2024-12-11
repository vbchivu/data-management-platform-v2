import { Router } from 'express';
import { body } from 'express-validator';
import AuthController from '../controllers/AuthController';

const router = Router();

router.post(
    '/register',
    [
        body('username').isString().notEmpty(),
        body('email').isEmail(),
        body('password').isLength({ min: 6 }),
    ],
    AuthController.registerUser
);

router.post(
    '/login',
    [
        body('email').isEmail(),
        body('password').exists(),
    ],
    AuthController.loginUser
);

export default router;
