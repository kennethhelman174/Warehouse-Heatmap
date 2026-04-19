import { Request, Response } from 'express';
import { StatsService, CadService } from '../services/stats.service';
import { asyncHandler } from '../middleware/error.middleware';

const statsService = new StatsService();
const cadService = new CadService();

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  const result = await statsService.getDashboardStats(facilityId);
  res.json(result);
});

export const uploadCad = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new Error('No file uploaded');
  const userId = (req as any).user.id;
  const result = await cadService.processUpload(userId, req.file.originalname, req.file.buffer);
  res.json(result);
});
