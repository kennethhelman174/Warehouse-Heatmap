import { Router } from 'express';
import multer from 'multer';
import authRoutes from './auth.routes';
import warehouseRoutes from './warehouse.routes';
import importRoutes from './import.routes';
import engineeringRoutes from './engineering.routes';
import * as StatsController from '../controllers/stats.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use('/auth', authRoutes);
router.use('/', warehouseRoutes);
router.use('/import', importRoutes);
router.use('/engineering', engineeringRoutes);

router.get('/stats', authenticate, StatsController.getStats);
router.post('/cad/upload', authenticate, authorize(['Admin', 'Engineer']), upload.single('file'), StatsController.uploadCad);

export default router;
