import { Router } from 'express';
import { EngineeringController } from '../controllers/engineering.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { engineeringAnalysisSchema, engineeringVerificationSchema } from '../validations/schemas';

const router = Router();

router.use(authenticate);

router.get('/dashboard', authorize(['Admin', 'Engineer']), EngineeringController.getDashboard);
router.post('/analyze', authorize(['Admin', 'Engineer']), validate(engineeringAnalysisSchema), EngineeringController.runAnalysis);
router.post('/actions/:actionId/verify', authorize(['Admin', 'Engineer']), validate(engineeringVerificationSchema), EngineeringController.verifyAction);

export default router;
