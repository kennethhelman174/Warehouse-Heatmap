import { Router } from 'express';
import multer from 'multer';
import { ImportController } from '../controllers/import.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { importCommitSchema } from '../validations/schemas';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate);

router.get('/jobs', ImportController.getJobs);
router.get('/jobs/:id', ImportController.getJobDetails);
router.post('/upload', authorize(['Admin', 'Engineer']), upload.single('file'), ImportController.upload);
router.post('/jobs/:id/commit', authorize(['Admin', 'Engineer']), validate(importCommitSchema), ImportController.commit);

export default router;
