import { WarehouseRepository } from '../repositories/warehouse.repository';
import { ActionRepository, RouteRepository } from '../repositories/action.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { AppError } from '../middleware/error.middleware';

const warehouseRepo = new WarehouseRepository();
const actionRepo = new ActionRepository();
const routeRepo = new RouteRepository();
const auditRepo = new AuditRepository();

export class WarehouseService {
  async getFacilities() {
    const raw = warehouseRepo.getFacilities();
    return raw.map((f: any) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      address: f.address,
      width: f.width,
      height: f.height,
      imageUrl: f.image_url,
      createdAt: f.created_at,
      updatedAt: f.updated_at
    }));
  }

  async updateFacility(userId: string, id: string, data: any) {
    const existing = warehouseRepo.findFacilityById(id);
    if (!existing) throw new AppError('Facility not found', 404);

    warehouseRepo.updateFacility(id, data);
    auditRepo.log(userId, 'UPDATE', 'facility', id, data);
    const updated = warehouseRepo.findFacilityById(id) as any;
    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      address: updated.address,
      width: updated.width,
      height: updated.height,
      imageUrl: updated.image_url,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };
  }

  async getVersions(facilityId: string) {
    const raw = warehouseRepo.getVersions(facilityId);
    return raw.map((v: any) => ({
      id: v.id,
      facilityId: v.facility_id,
      name: v.name,
      description: v.description,
      status: v.status,
      isBaseVersion: !!v.is_base_version,
      createdBy: v.created_by,
      createdAt: v.created_at
    }));
  }

  async createVersion(userId: string, facilityId: string, data: any) {
    const version = { 
      id: `v-${Date.now()}`, 
      facility_id: facilityId,
      name: data.name,
      description: data.description,
      status: 'draft',
      is_base_version: 0,
      created_by: userId
    };
    warehouseRepo.createVersion(version);
    auditRepo.log(userId, 'CREATE', 'map_version', version.id, { name: version.name });
    return {
      id: version.id,
      facilityId: version.facility_id,
      name: version.name,
      description: version.description,
      status: version.status,
      isBaseVersion: !!version.is_base_version,
      createdBy: version.created_by
    };
  }

  // Zones
  async getZones(versionId: string) {
    const rawZones = warehouseRepo.getZones(versionId);
    return rawZones.map((z: any) => ({
      id: z.id,
      versionId: z.version_id,
      name: z.name,
      type: z.type,
      x: z.x,
      y: z.y,
      width: z.width,
      height: z.height,
      rotation: z.rotation,
      color: z.color,
      metadata: z.metadata_json ? JSON.parse(z.metadata_json as string) : {}
    }));
  }

  async createZone(userId: string, data: any) {
    const zone = { 
      id: data.id || Date.now().toString(), 
      version_id: data.versionId,
      name: data.name,
      type: data.type,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      rotation: data.rotation || 0,
      color: data.color,
      metadata_json: data.metadata ? JSON.stringify(data.metadata) : null
    };
    warehouseRepo.createZone(zone);
    auditRepo.log(userId, 'CREATE', 'zone', zone.id, { name: zone.name });
    const created = warehouseRepo.findZoneById(zone.id) as any;
    if (!created) return null;
    return {
      id: created.id,
      versionId: created.version_id,
      name: created.name,
      type: created.type,
      x: created.x,
      y: created.y,
      width: created.width,
      height: created.height,
      rotation: created.rotation,
      color: created.color,
      metadata: created.metadata_json ? JSON.parse(created.metadata_json as string) : {}
    };
  }

  async updateZone(userId: string, id: string, data: any) {
    warehouseRepo.updateZone(id, data);
    auditRepo.log(userId, 'UPDATE', 'zone', id, data);
    const updated = warehouseRepo.findZoneById(id) as any;
    if (!updated) throw new AppError('Zone not found', 404);
    return {
      id: updated.id,
      versionId: updated.version_id,
      name: updated.name,
      type: updated.type,
      x: updated.x,
      y: updated.y,
      width: updated.width,
      height: updated.height,
      rotation: updated.rotation,
      color: updated.color,
      metadata: updated.metadata_json ? JSON.parse(updated.metadata_json as string) : {}
    };
  }

  async deleteZone(userId: string, id: string) {
    warehouseRepo.deleteZone(id);
    auditRepo.log(userId, 'DELETE', 'zone', id);
  }

  // Racks
  async getRacks(zoneId?: string) {
    if (!zoneId) {
      // If no zoneId, we're likely on the Rack Elevation page, return detailed locations
      const raw = warehouseRepo.getDetailedRacks();
      return raw.map((r: any) => ({
        id: r.id,
        rackId: r.rack_id,
        aisle: r.aisle || 'Unknown',
        row: r.row || 'Unknown',
        bay: r.bay || 'Unknown',
        level: r.level || '0',
        slot: r.slot || 'Unknown',
        locationCode: r.location_code || r.id,
        rackType: r.rack_type || 'standard',
        picks: r.picks || 0,
        incidents: r.incidents || 0,
        occupancyStatus: r.occupancy_status || 'available'
      }));
    }

    const raw = warehouseRepo.getRacks(zoneId);
    return raw.map((r: any) => ({
      id: r.id,
      zoneId: r.zone_id,
      name: r.name,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      depth: r.depth,
      levels: r.levels,
      bays: r.bays,
      capacity: r.capacity
    }));
  }

  async createRack(userId: string, data: any) {
    const rack = {
      id: `rc-${Date.now()}`,
      zone_id: data.zoneId,
      name: data.name,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      depth: data.depth,
      levels: data.levels,
      bays: data.bays,
      capacity: data.capacity
    };
    warehouseRepo.createRack(rack);
    auditRepo.log(userId, 'CREATE', 'rack', rack.id, { name: rack.name });
    return {
      id: rack.id,
      zoneId: rack.zone_id,
      name: rack.name,
      x: rack.x,
      y: rack.y,
      width: rack.width,
      height: rack.height,
      depth: rack.depth,
      levels: rack.levels,
      bays: rack.bays,
      capacity: rack.capacity
    };
  }

  async getLocationStats(locationId: string) {
    const stats = warehouseRepo.getLocationStats(locationId) as any;
    return {
      locationId,
      picks: stats?.picks || 0,
      incidents: stats?.incidents || 0,
      occupancyStatus: stats?.occupancy_status || 'available'
    };
  }

  // Network
  async getNetwork(versionId: string) {
    const rawNodes = warehouseRepo.getNodes(versionId) as any[];
    const rawEdges = warehouseRepo.getEdges(versionId) as any[];

    const nodes = rawNodes.map((n: any) => ({
      id: n.id,
      versionId: n.version_id,
      x: n.x,
      y: n.y,
      type: n.type,
      allowedTraffic: n.allowed_traffic,
      zoneId: n.zone_id
    }));

    const edges = rawEdges.map((e: any) => ({
      id: e.id,
      versionId: e.version_id,
      from: e.from_node,
      to: e.to_node,
      weight: e.weight,
      type: e.type,
      isOneWay: !!e.is_one_way,
      speedLimit: e.speed_limit
    }));

    return { nodes, edges };
  }

  async createNode(userId: string, data: any) {
    const node = { 
      id: data.id || `n-${Date.now()}`, 
      version_id: data.versionId,
      x: data.x,
      y: data.y,
      type: data.type || 'standard',
      allowed_traffic: data.allowedTraffic || 'both',
      zone_id: data.zoneId
    };
    warehouseRepo.createNode(node);
    auditRepo.log(userId, 'CREATE', 'node', node.id);
    return {
      id: node.id,
      versionId: node.version_id,
      x: node.x,
      y: node.y,
      type: node.type,
      allowedTraffic: node.allowed_traffic,
      zoneId: node.zone_id
    };
  }

  async updateNode(userId: string, id: string, data: any) {
    const mapped = {
      x: data.x,
      y: data.y,
      type: data.type,
      allowed_traffic: data.allowedTraffic,
      zone_id: data.zoneId
    };
    warehouseRepo.updateNode(id, mapped);
    auditRepo.log(userId, 'UPDATE', 'node', id, data);
    return {
      id,
      ...data
    };
  }

  async deleteNode(userId: string, id: string) {
    warehouseRepo.deleteNode(id);
    auditRepo.log(userId, 'DELETE', 'node', id);
  }

  async createEdge(userId: string, data: any) {
    const edge = { 
      id: data.id || Date.now().toString(), 
      version_id: data.versionId,
      from_node: data.from,
      to_node: data.to,
      weight: data.weight || 1,
      type: data.type || 'forklift',
      is_one_way: data.isOneWay ? 1 : 0,
      speed_limit: data.speedLimit
    };
    warehouseRepo.createEdge(edge);
    auditRepo.log(userId, 'CREATE', 'edge', edge.id);
    return {
      id: edge.id,
      versionId: edge.version_id,
      from: edge.from_node,
      to: edge.to_node,
      weight: edge.weight,
      type: edge.type,
      isOneWay: !!edge.is_one_way,
      speedLimit: edge.speed_limit
    };
  }

  async deleteEdge(userId: string, id: string) {
    warehouseRepo.deleteEdge(id);
    auditRepo.log(userId, 'DELETE', 'edge', id);
  }

  // Events
  async getEvents(facilityId?: string) {
    const raw = facilityId 
      ? warehouseRepo.getEventsByFacility(facilityId, 100)
      : warehouseRepo.getRecentEvents(100);
      
    return raw.map((e: any) => ({
      id: e.id,
      type: e.type,
      x: e.x,
      y: e.y,
      timestamp: e.timestamp,
      severity: e.severity,
      description: e.description,
      zoneId: e.zone_id,
      actionId: e.action_id,
      facilityId: e.facility_id
    }));
  }

  async createEvent(userId: string, data: any) {
    const event = { 
      id: `ev-${Date.now()}`, 
      type: data.type,
      x: data.x,
      y: data.y,
      timestamp: data.timestamp || new Date().toISOString(),
      severity: data.severity,
      description: data.description,
      zone_id: data.zoneId,
      action_id: data.actionId,
      facility_id: data.facilityId
    };
    warehouseRepo.createEvent(event);
    auditRepo.log(userId, 'CREATE', 'event', event.id, { type: event.type });
    return {
      id: event.id,
      type: event.type,
      x: event.x,
      y: event.y,
      timestamp: event.timestamp,
      severity: event.severity,
      description: event.description,
      zoneId: event.zone_id,
      actionId: event.action_id,
      facilityId: event.facility_id
    };
  }

  // Observations
  async getObservations(facilityId: string) {
    const raw = warehouseRepo.getObservations(facilityId);
    return raw.map((o: any) => ({
      id: o.id,
      facilityId: o.facility_id,
      type: o.type,
      severity: o.severity,
      status: o.status,
      x: o.x,
      y: o.y,
      zoneId: o.zone_id,
      nodeId: o.node_id,
      description: o.description,
      reporterId: o.reporter_id,
      timestamp: o.timestamp
    }));
  }

  async createObservation(userId: string, data: any) {
    const obs = { 
      id: `obs-${Date.now()}`, 
      facility_id: data.facilityId,
      type: data.type,
      severity: data.severity,
      status: 'open',
      x: data.x,
      y: data.y,
      zone_id: data.zoneId,
      node_id: data.nodeId,
      description: data.description,
      reporter_id: userId,
      timestamp: new Date().toISOString()
    };
    warehouseRepo.createObservation(obs);
    auditRepo.log(userId, 'CREATE', 'observation', obs.id, { type: obs.type });
    return {
      id: obs.id,
      facilityId: obs.facility_id,
      type: obs.type,
      severity: obs.severity,
      status: obs.status,
      x: obs.x,
      y: obs.y,
      zoneId: obs.zone_id,
      nodeId: obs.node_id,
      description: obs.description,
      reporterId: obs.reporter_id,
      timestamp: obs.timestamp
    };
  }

  // Actions
  async getActions() {
    const rawActions = actionRepo.getActions() as any[];
    return rawActions.map(a => ({
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
  }

  async createAction(userId: string, data: any) {
    const action = {
      id: `act-${Date.now()}`,
      observation_id: data.observationId,
      title: data.title,
      description: data.description,
      zone: data.zone || 'Global',
      category: data.category,
      owner: data.owner,
      priority: data.priority,
      due_date: data.dueDate,
      status: data.status || 'Open'
    };
    
    actionRepo.createAction(action);
    auditRepo.log(userId, 'CREATE', 'action_item', action.id, { title: action.title });
    
    return {
      id: action.id,
      observationId: action.observation_id,
      title: action.title,
      description: action.description,
      zone: action.zone,
      category: action.category,
      owner: action.owner,
      priority: action.priority,
      dueDate: action.due_date,
      status: action.status
    };
  }

  async updateActionStatus(userId: string, id: string, status: string) {
    actionRepo.updateActionStatus(id, status, userId);
    auditRepo.log(userId, 'UPDATE_STATUS', 'action_item', id, { status });
  }

  // Routes
  async getSavedRoutes(facilityId?: string, versionId?: string) {
    const routes = warehouseRepo.getSavedRoutes(facilityId, versionId) as any[];
    return routes.map(r => ({ 
      id: r.id,
      facilityId: r.facility_id,
      versionId: r.version_id,
      name: r.name,
      path: r.path_json ? JSON.parse(r.path_json as string) : [],
      metrics: r.metrics_json ? JSON.parse(r.metrics_json as string) : {},
      createdBy: r.created_by,
      createdAt: r.created_at
    }));
  }

  async saveRoute(userId: string, data: any) {
    const route = {
      id: `rt-${Date.now()}`,
      facility_id: data.facilityId,
      version_id: data.versionId,
      name: data.name,
      path: data.path,
      metrics: data.metrics,
      created_by: userId
    };
    warehouseRepo.saveRoute(route);
    auditRepo.log(userId, 'CREATE', 'saved_route', route.id, { name: route.name });
    return {
      id: route.id,
      facilityId: route.facility_id,
      versionId: route.version_id,
      name: route.name,
      path: route.path,
      metrics: route.metrics,
      createdBy: route.created_by
    };
  }

  // Scenarios
  async getScenarios(facilityId: string) {
    const raw = warehouseRepo.getScenarios(facilityId);
    return raw.map((s: any) => ({
      id: s.id,
      facilityId: s.facility_id,
      name: s.name,
      description: s.description,
      baseVersionId: s.base_version_id,
      createdAt: s.created_at,
      createdBy: s.created_by
    }));
  }

  async getScenarioRuns(scenarioId: string) {
    const raw = warehouseRepo.getScenarioRuns(scenarioId);
    return raw.map((r: any) => ({
      id: r.id,
      scenarioId: r.scenario_id,
      status: r.status,
      parameters: r.parameters_json ? JSON.parse(r.parameters_json) : {},
      results: r.results_json ? JSON.parse(r.results_json) : {},
      startedAt: r.started_at,
      completedAt: r.completed_at
    }));
  }

  // Labor
  async getLaborRecords(facilityId: string) {
    const raw = warehouseRepo.getLaborRecords(facilityId);
    return raw.map((r: any) => ({
      id: r.id,
      facilityId: r.facility_id,
      operatorId: r.operator_id,
      activityType: r.activity_type,
      startTime: r.start_time,
      endTime: r.end_time,
      actualPicks: r.actual_picks,
      expectedPicks: r.expected_picks
    }));
  }

  async getLaborPlans(facilityId: string) {
    const raw = warehouseRepo.getLaborPlans(facilityId);
    return raw.map((p: any) => ({
      id: p.id,
      facilityId: p.facility_id,
      date: p.date,
      shift: p.shift,
      headcountTarget: p.headcount_target,
      volumeTarget: p.volume_target
    }));
  }

  // Costs & Benchmarking
  async getCostAssumptions(facilityId: string) {
    const raw = warehouseRepo.getCostAssumptions(facilityId);
    return raw.map((c: any) => ({
      id: c.id,
      facilityId: c.facility_id,
      category: c.category,
      key: c.key,
      value: c.value,
      unit: c.unit,
      effectiveDate: c.effective_date
    }));
  }

  async getBenchmarks(facilityId: string) {
    const raw = warehouseRepo.getBenchmarks(facilityId);
    return raw.map((b: any) => ({
      id: b.id,
      facilityId: b.facility_id,
      metricKey: b.metric_key,
      value: b.value,
      period: b.period,
      comparedToIndustry: b.compared_to_industry
    }));
  }
}
