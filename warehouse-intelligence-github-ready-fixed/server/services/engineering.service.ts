import { engineeringRepo } from '../repositories/engineering.repository';
import { WarehouseRepository } from '../repositories/warehouse.repository';
import { ActionRepository } from '../repositories/action.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { AppError } from '../middleware/error.middleware';

const warehouseRepo = new WarehouseRepository();
const actionRepo = new ActionRepository();
const auditRepo = new AuditRepository();

export class EngineeringService {
  static async getDashboardInsights(facilityId: string) {
    const rawInsights = await engineeringRepo.getInsights(facilityId);
    const rawActions = await actionRepo.getActions(facilityId) as any[];
    const safetyTrends = await warehouseRepo.getSafetyTrends(facilityId);
    
    const insights = rawInsights.map((i: any) => ({
      id: i.id,
      facilityId: i.facility_id,
      versionId: i.version_id,
      type: i.type,
      category: i.category,
      severity: i.severity,
      score: i.score,
      details: i.details_json ? JSON.parse(i.details_json) : {},
      x: i.x,
      y: i.y,
      createdAt: i.created_at
    }));

    const actions = rawActions.map(a => ({
      id: a.id,
      observationId: a.observation_id,
      title: a.title,
      description: a.description,
      zone: a.zone,
      category: a.category,
      owner: a.owner,
      priority: a.priority,
      dueDate: a.due_date,
      status: a.status,
      verifiedAt: a.verified_at,
      verifiedBy: a.verified_by,
      effectivenessScore: a.effectiveness_score,
      effectivenessNotes: a.effectiveness_notes,
      createdAt: a.created_at,
      updatedAt: a.updated_at
    }));

    return {
      insights,
      actions,
      safetyTrends
    };
  }

  static async runSafetyAnalysis(facilityId: string, versionId: string) {
    const clusters = await engineeringRepo.getEventClusters(facilityId);
    
    // 1. Spatial Hotspots from Events
    for (const cluster of clusters as any[]) {
      const insightId = `hotspot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      await engineeringRepo.createInsight({
        id: insightId,
        facility_id: facilityId,
        version_id: versionId,
        type: 'safety_hotspot',
        category: 'EHS',
        severity: Math.min(5, Math.ceil(cluster.avg_severity)),
        score: cluster.event_count * cluster.avg_severity,
        details_json: JSON.stringify({
          eventCount: cluster.event_count,
          zoneName: cluster.zone_name,
          riskLevel: cluster.event_count > 5 ? 'High' : 'Medium'
        }),
        x: cluster.center_x,
        y: cluster.center_y
      });
    }

    // 2. Network Topology Risks (Interaction Hotspots)
    const nodes = await warehouseRepo.getNodes(versionId) as any[];
    const sharedIntersections = nodes.filter(n => (n.type === 'intersection' || n.type === 'safety_stop') && n.allowed_traffic === 'both');
    
    for (const node of sharedIntersections) {
      const insightId = `risk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      await engineeringRepo.createInsight({
        id: insightId,
        facility_id: facilityId,
        version_id: versionId,
        type: 'interaction_risk',
        category: 'EHS',
        severity: 3,
        score: 60,
        details_json: JSON.stringify({
          riskType: 'Interaction Crossing',
          description: 'High-risk shared traffic flow identified at network node.'
        }),
        x: node.x,
        y: node.y
      });
    }

    return { success: true, count: clusters.length + sharedIntersections.length };
  }

  static async runIEAnalysis(facilityId: string, versionId: string) {
    const metrics = await engineeringRepo.getTravelMetrics(facilityId);
    
    // Simple logic: find operators with low efficiency
    for (const metric of metrics as any[]) {
      if (metric.pick_efficiency < 80) {
        const insightId = `ie-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        await engineeringRepo.createInsight({
          id: insightId,
          facility_id: facilityId,
          version_id: versionId,
          type: 'travel_inefficiency',
          category: 'IE',
          severity: metric.pick_efficiency < 50 ? 4 : 2,
          score: 100 - metric.pick_efficiency,
          details_json: JSON.stringify({
            operatorId: metric.operator_id,
            totalPicks: metric.total_picks,
            efficiency: metric.pick_efficiency.toFixed(1) + '%'
          }),
          x: null, 
          y: null
        });
      }
    }

    return { success: true, count: metrics.length };
  }

  static async verifyActionOutcome(actionId: string, userId: string, score: number, notes: string) {
    const action = await actionRepo.verifyAction(actionId, userId, score, notes);
    auditRepo.log(userId, 'VERIFY', 'action_item', actionId, { score });
    return action;
  }
}
