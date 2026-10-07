import { Router } from 'express';
import cookieParser from 'cookie-parser';
import * as authCtrl from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rate-limit';

export const authRoutes = Router();

authRoutes.use(cookieParser());

// Brute-force protection: 10 attempts / 15 min per IP on credential + token endpoints
authRoutes.post('/register', authLimiter, authCtrl.register);
authRoutes.post('/login', authLimiter, authCtrl.login);
authRoutes.post('/refresh', authLimiter, authCtrl.refresh);
authRoutes.post('/logout', authCtrl.logout);
authRoutes.post('/password-reset/email', authLimiter, authCtrl.sendPasswordResetEmail);
authRoutes.get('/me', authenticate, authCtrl.me);
