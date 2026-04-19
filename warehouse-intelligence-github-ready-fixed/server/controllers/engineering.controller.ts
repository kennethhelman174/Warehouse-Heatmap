import { Request, Response } from 'express';
import { EngineeringService } from '../services/engineering.service';

export class EngineeringController {
  static async getDashboard(req: Request, res: Response) {
    const { facilityId } = req.query;
    if (!facilityId) return res.status(400).json({ error: 'Facility ID required' });
    const data = await EngineeringService.getDashboardInsights(facilityId as string);
    res.json(data);
  }

  static async runAnalysis(req: Request, res: Response) {
    const { facilityId, versionId, type } = req.body;
    if (!facilityId || !versionId) return res.status(400).json({ error: 'Missing params' });
    
    let result;
    if (type === 'EHS') {
      result = await EngineeringService.runSafetyAnalysis(facilityId, versionId);
    } else {
      result = await EngineeringService.runIEAnalysis(facilityId, versionId);
    }
    
    res.json(result);
  }

  static async verifyAction(req: Request, res: Response) {
    const { actionId } = req.params;
    const { score, notes } = req.body;
    const userId = (req as any).user.id;
    
    const result = await EngineeringService.verifyActionOutcome(actionId, userId, score, notes);
    res.json(result);
  }
}
