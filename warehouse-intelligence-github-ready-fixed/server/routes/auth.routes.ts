import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { loginSchema, registerSchema } from '../validations/schemas';
import { loginLimiter } from '../middleware/rate-limiter.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
router.post('/register', loginLimiter, validate(registerSchema), AuthController.register);
router.get('/me', authenticate, AuthController.getMe);

export default router;
