import { BaseRepository } from './base.repository';

export class EngineeringRepository extends BaseRepository {
  createInsight(insight: any) {
    const { id, facility_id, version_id, type, category, severity, score, details_json, x, y } = insight;
    return this.prepare(`
      INSERT INTO engineering_insights (id, facility_id, version_id, type, category, severity, score, details_json, x, y)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, facility_id, version_id, type, category, severity, score, details_json, x, y);
  }

  getInsights(facilityId: string, category?: string) {
    let sql = 'SELECT * FROM engineering_insights WHERE facility_id = ?';
    const params: any[] = [facilityId];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    sql += ' ORDER BY created_at DESC';
    return this.prepare(sql).all(...params);
  }

  deleteInsight(id: string) {
    return this.prepare('DELETE FROM engineering_insights WHERE id = ?').run(id);
  }

  // Safety Hotspot analysis - count events by location
  getEventClusters(facilityId: string, radius: number = 50) {
    // Simplified clustering for SQLite
    // In a real system, we'd use spatial extensions or a more complex algorithm
    return this.prepare(`
      SELECT 
        e.zone_id,
        z.name as zone_name,
        COUNT(*) as event_count,
        AVG(e.severity) as avg_severity,
        AVG(e.x) as center_x,
        AVG(e.y) as center_y
      FROM events e
      JOIN zones z ON e.zone_id = z.id
      GROUP BY e.zone_id
      HAVING event_count > 2
    `).all();
  }

  // IE Analysis - Travel logic
  getTravelMetrics(facilityId: string) {
    return this.prepare(`
      SELECT 
        operator_id,
        activity_type,
        COUNT(*) as record_count,
        SUM(actual_picks) as total_picks,
        SUM(expected_picks) as target_picks,
        (CAST(SUM(actual_picks) AS REAL) / NULLIF(SUM(expected_picks), 0)) * 100 as pick_efficiency
      FROM labor_records
      WHERE facility_id = ?
      GROUP BY operator_id, activity_type
    `).all(facilityId);
  }
}

export const engineeringRepo = new EngineeringRepository();
