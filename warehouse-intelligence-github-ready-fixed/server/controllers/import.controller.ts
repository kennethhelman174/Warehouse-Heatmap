import { Request, Response } from 'express';
import { ImportService } from '../services/import.service';
import { asyncHandler } from '../middleware/error.middleware';

const importService = new ImportService();

export class ImportController {
  static getJobs = asyncHandler(async (req: Request, res: Response) => {
    const jobs = await importService.getJobs();
    res.json(jobs);
  });

  static getJobDetails = asyncHandler(async (req: Request, res: Response) => {
    const details = await importService.getJobDetails(req.params.id);
    res.json(details);
  });

  static upload = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new Error('No file uploaded');
    const userId = (req as any).user.id;
    
    const job = await importService.createJob(userId, {
      sourceType: req.body.sourceType,
      fileName: req.file.originalname
    });

    // Run processing in background or wait?
    // User wants "job status tracking", so we return the job and process.
    importService.processFile(job.id, req.body.sourceType, req.file.path, req.file.originalname)
      .catch(err => console.error('Processing error for job', job.id, err));

    res.status(202).json(job);
  });

  static commit = asyncHandler(async (req: Request, res: Response) => {
    const { facilityId, versionId } = req.body;
    const userId = (req as any).user.id;
    const result = await importService.commitJob(userId, req.params.id, facilityId, versionId);
    res.json(result);
  });
}
