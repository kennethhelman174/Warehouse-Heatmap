import { BaseRepository } from './base.repository';

export class WarehouseRepository extends BaseRepository {
  // Facilities
  getFacilities() {
    return this.prepare('SELECT * FROM facilities').all();
  }

  createFacility(facility: any) {
    return this.prepare('INSERT INTO facilities (id, name, width, height, description, address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(facility.id, facility.name, facility.width, facility.height, facility.description, facility.address);
  }

  updateFacility(id: string, updates: any) {
    return this.prepare(`
      UPDATE facilities 
      SET name = COALESCE(?, name), 
          width = COALESCE(?, width), 
          height = COALESCE(?, height), 
          description = COALESCE(?, description), 
          address = COALESCE(?, address)
      WHERE id = ?
    `).run(updates.name, updates.width, updates.height, updates.description, updates.address, id);
  }

  findFacilityById(id: string) {
    return this.prepare('SELECT * FROM facilities WHERE id = ?').get(id);
  }

  // Map Versions
  getVersions(facilityId: string) {
    return this.prepare('SELECT * FROM map_versions WHERE facility_id = ?').all(facilityId);
  }

  createVersion(version: any) {
    return this.prepare('INSERT INTO map_versions (id, facility_id, name, description, status, is_base_version, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(version.id, version.facility_id, version.name, version.description, version.status, version.is_base_version, version.created_by);
  }

  // Zones
  getZones(versionId: string) {
    return this.prepare('SELECT * FROM zones WHERE version_id = ?').all(versionId);
  }

  findZoneById(id: string) {
    return this.prepare('SELECT * FROM zones WHERE id = ?').get(id);
  }

  createZone(zone: any) {
    return this.prepare('INSERT INTO zones (id, version_id, name, type, x, y, width, height, rotation, color, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(zone.id, zone.version_id, zone.name, zone.type, zone.x, zone.y, zone.width, zone.height, zone.rotation || 0, zone.color, zone.metadata_json);
  }

  updateZone(id: string, updates: any) {
    return this.prepare(`
      UPDATE zones 
      SET name = COALESCE(?, name), 
          type = COALESCE(?, type), 
          x = COALESCE(?, x), 
          y = COALESCE(?, y), 
          width = COALESCE(?, width), 
          height = COALESCE(?, height), 
          rotation = COALESCE(?, rotation),
          color = COALESCE(?, color),
          metadata_json = COALESCE(?, metadata_json)
      WHERE id = ?
    `).run(updates.name, updates.type, updates.x, updates.y, updates.width, updates.height, updates.rotation, updates.color, JSON.stringify(updates.metadata), id);
  }

  deleteZone(id: string) {
    return this.prepare('DELETE FROM zones WHERE id = ?').run(id);
  }

  // Map Network
  getNodes(versionId: string) {
    return this.prepare('SELECT * FROM map_nodes WHERE version_id = ?').all(versionId);
  }

  getEdges(versionId: string) {
    return this.prepare('SELECT * FROM map_edges WHERE version_id = ?').all(versionId);
  }

  createNode(node: any) {
    return this.prepare('INSERT INTO map_nodes (id, version_id, x, y, type, allowed_traffic, zone_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(node.id, node.version_id, node.x, node.y, node.type, node.allowed_traffic, node.zone_id);
  }

  createEdge(edge: any) {
    return this.prepare('INSERT INTO map_edges (id, version_id, from_node, to_node, weight, type, is_one_way, speed_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(edge.id, edge.version_id, edge.from_node, edge.to_node, edge.weight, edge.type, edge.is_one_way, edge.speed_limit);
  }

  deleteNode(id: string) {
    return this.prepare('DELETE FROM map_nodes WHERE id = ?').run(id);
  }

  deleteEdge(id: string) {
    return this.prepare('DELETE FROM map_edges WHERE id = ?').run(id);
  }

  updateNode(id: string, updates: any) {
    return this.prepare(`
      UPDATE map_nodes 
      SET x = COALESCE(?, x), 
          y = COALESCE(?, y), 
          type = COALESCE(?, type), 
          allowed_traffic = COALESCE(?, allowed_traffic), 
          zone_id = COALESCE(?, zone_id)
      WHERE id = ?
    `).run(updates.x, updates.y, updates.type, updates.allowed_traffic, updates.zone_id, id);
  }

  // Saved Routes
  getSavedRoutes(facilityId?: string, versionId?: string) {
    let query = 'SELECT * FROM saved_routes';
    const params: any[] = [];
    if (facilityId || versionId) {
      query += ' WHERE';
      if (facilityId) {
        query += ' facility_id = ?';
        params.push(facilityId);
      }
      if (versionId) {
        if (facilityId) query += ' AND';
        query += ' version_id = ?';
        params.push(versionId);
      }
    }
    return this.prepare(query).all(...params);
  }

  saveRoute(route: any) {
    return this.prepare('INSERT INTO saved_routes (id, facility_id, version_id, name, path_json, metrics_json, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(route.id, route.facility_id, route.version_id, route.name, JSON.stringify(route.path), JSON.stringify(route.metrics), route.created_by);
  }

  // Racks
  getRacks(zoneId?: string) {
    if (zoneId) {
      return this.prepare('SELECT * FROM racks WHERE zone_id = ?').all(zoneId);
    }
    return this.prepare('SELECT * FROM racks').all();
  }

  getDetailedRacks() {
    return this.prepare(`
      SELECT 
        rl.*,
        ls.picks,
        ls.incidents,
        ls.occupancy_status
      FROM rack_locations rl
      LEFT JOIN location_stats ls ON rl.id = ls.location_id
    `).all();
  }

  createRack(rack: any) {
    return this.prepare('INSERT INTO racks (id, zone_id, name, x, y, width, height, depth, levels, bays, capacity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(rack.id, rack.zone_id, rack.name, rack.x, rack.y, rack.width, rack.height, rack.depth, rack.levels, rack.bays, rack.capacity);
  }

  getLocationStats(locationId: string) {
    return this.prepare('SELECT * FROM location_stats WHERE location_id = ?').get(locationId);
  }

  // Observations
  getObservations(facilityId: string) {
    return this.prepare('SELECT * FROM observations WHERE facility_id = ?').all(facilityId);
  }

  createObservation(obs: any) {
    return this.prepare('INSERT INTO observations (id, facility_id, type, severity, status, x, y, zone_id, node_id, description, reporter_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(obs.id, obs.facility_id, obs.type, obs.severity, obs.status, obs.x, obs.y, obs.zone_id, obs.node_id, obs.description, obs.reporter_id, obs.timestamp);
  }

  // Labor
  getLaborRecords(facilityId: string) {
    return this.prepare('SELECT * FROM labor_records WHERE facility_id = ?').all(facilityId);
  }

  getLaborPlans(facilityId: string) {
    return this.prepare('SELECT * FROM labor_plans WHERE facility_id = ?').all(facilityId);
  }

  // Costs & Benchmarks
  getCostAssumptions(facilityId: string) {
    return this.prepare('SELECT * FROM cost_assumptions WHERE facility_id = ?').all(facilityId);
  }

  getBenchmarks(facilityId: string) {
    return this.prepare('SELECT * FROM benchmark_snapshots WHERE facility_id = ?').all(facilityId);
  }

  // Scenarios
  getScenarios(facilityId: string) {
    return this.prepare('SELECT * FROM scenarios WHERE facility_id = ?').all(facilityId);
  }

  getScenarioRuns(scenarioId: string) {
    return this.prepare('SELECT * FROM scenario_runs WHERE scenario_id = ?').all(scenarioId);
  }

  createScenario(scenario: any) {
    return this.prepare('INSERT INTO scenarios (id, facility_id, name, description, base_version_id, created_by) VALUES (?, ?, ?, ?, ?, ?)')
      .run(scenario.id, scenario.facility_id, scenario.name, scenario.description, scenario.base_version_id, scenario.created_by);
  }

  createScenarioRun(run: any) {
    return this.prepare('INSERT INTO scenario_runs (id, scenario_id, status, parameters_json, results_json, started_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(run.id, run.scenario_id, run.status, JSON.stringify(run.parameters), JSON.stringify(run.results), run.started_at);
  }

  createEvent(event: any) {
    return this.prepare('INSERT INTO events (id, type, x, y, timestamp, severity, description, zone_id, action_id, facility_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(event.id, event.type, event.x, event.y, event.timestamp, event.severity, event.description, event.zone_id, event.action_id, event.facility_id || null);
  }

  // Stats
  countEntities(table: string, facilityId?: string) {
    if (facilityId) {
      if (table === 'zones') {
        return (this.prepare(`
          SELECT COUNT(*) as count 
          FROM zones z
          JOIN map_versions v ON z.version_id = v.id
          WHERE v.facility_id = ?
        `).get(facilityId) as any).count;
      }
      // For other tables, we might need different logic, but zones is the main one for dashboard
    }
    return (this.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as any).count;
  }

  getEventCountByType(type: string, facilityId?: string) {
    if (facilityId) {
      return (this.prepare('SELECT COUNT(*) as count FROM events WHERE type = ? AND facility_id = ?').get(type, facilityId) as any).count;
    }
    return (this.prepare('SELECT COUNT(*) as count FROM events WHERE type = ?').get(type) as any).count;
  }

  getEventsByFacility(facilityId: string, limit: number = 50) {
    return this.prepare(`
      SELECT * 
      FROM events
      WHERE facility_id = ? OR facility_id IS NULL
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(facilityId, limit);
  }

  getRecentEvents(limit: number = 5, facilityId?: string) {
    if (facilityId) {
      return this.getEventsByFacility(facilityId, limit);
    }
    return this.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT ?').all(limit);
  }

  createLaborRecord(rec: any) {
    return this.prepare('INSERT INTO labor_records (id, facility_id, operator_id, activity_type, start_time, end_time, actual_picks, expected_picks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(rec.id, rec.facility_id, rec.operator_id, rec.activity_type, rec.start_time, rec.end_time || null, rec.actual_picks, rec.expected_picks);
  }

  createBenchmark(bm: any) {
    return this.prepare('INSERT INTO benchmark_snapshots (id, facility_id, metric_key, value, period, compared_to_industry) VALUES (?, ?, ?, ?, ?, ?)')
      .run(bm.id, bm.facility_id, bm.metric_key, bm.value, bm.period, bm.compared_to_industry || null);
  }

  createRouteTemplate(rt: any) {
    return this.prepare('INSERT INTO route_templates (id, facility_id, version_id, name, start_node_id, end_node_id, equipment_type) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(rt.id, rt.facility_id, rt.version_id, rt.name, rt.start_node_id, rt.end_node_id, rt.equipment_type || null);
  }

  getSafetyTrends(facilityId?: string, daysBack: number = 7) {
    let query = `
      SELECT 
        strftime('%w', timestamp) as day_of_week,
        SUM(CASE WHEN severity >= 3 THEN 1 ELSE 0 END) as incidents,
        SUM(CASE WHEN severity < 3 THEN 1 ELSE 0 END) as nearMisses
      FROM events e
    `;
    const params: any[] = [];
    
    if (facilityId) {
      query += ` WHERE (e.facility_id = ? OR e.facility_id IS NULL) AND e.timestamp >= date('now', ?) `;
      params.push(facilityId, `-${daysBack} days`);
    } else {
      query += ` WHERE e.timestamp >= date('now', ?) `;
      params.push(`-${daysBack} days`);
    }
    
    query += `
      GROUP BY day_of_week
      ORDER BY day_of_week
    `;
    
    return this.prepare(query).all(...params);
  }
}
