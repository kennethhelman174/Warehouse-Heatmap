/**
 * CANONICAL ROLE MODEL
 * Admin: Full system access
 * Engineer: Map editing, analytics, engineering tools
 * Operator: Map viewing, safety reporting, event creation
 * Viewer: Read-only access to dashboards and maps
 */
export type Role = 'Admin' | 'Engineer' | 'Operator' | 'Viewer';

export const PERMISSIONS = {
  CAN_MANAGE_FACILITIES: ['Admin'] as Role[],
  CAN_EDIT_MAP: ['Admin', 'Engineer'] as Role[],
  CAN_RUN_ANALYSIS: ['Admin', 'Engineer'] as Role[],
  CAN_MANAGE_ACTIONS: ['Admin', 'Engineer'] as Role[],
  CAN_REPORT_SAFETY: ['Admin', 'Engineer', 'Operator'] as Role[],
  CAN_VIEW_SIMULATIONS: ['Admin', 'Engineer', 'Operator'] as Role[],
  CAN_ACCESS_ADMIN: ['Admin'] as Role[],
  CAN_ACCESS_ENGINEERING: ['Admin', 'Engineer'] as Role[],
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Facility {
  id: string;
  name: string;
  description?: string;
  address?: string;
  width: number; // in feet
  height: number; // in feet
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MapVersion {
  id: string;
  facilityId: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  isBaseVersion: boolean;
  createdAt: string;
  createdBy?: string;
}

export type ZoneType = 'aisle' | 'rack' | 'dock' | 'staging' | 'pedestrian' | 'charging' | 'office' | 'restricted' | 'crossing' | 'barrier' | 'maintenance' | 'buffer' | 'dock_lane' | 'staging_lane' | 'battery_area' | 'blind_corner' | 'impact_bollard' | 'pedestrian_path' | 'protected_walkway';

export interface Zone {
  id: string;
  versionId: string;
  name: string;
  type: ZoneType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // Added for true engineering utility
  color?: string;
  metadata?: Record<string, any>;
}

export type NodeType = 'standard' | 'intersection' | 'dock_door' | 'rack_face' | 'charging_station' | 'checkpoint' | 'safety_stop' | 'crossing_point' | 'entry_exit' | 'restricted_entry' | 'hazard_point';

export interface MapNode {
  id: string;
  versionId: string;
  x: number;
  y: number;
  type?: NodeType;
  allowedTraffic?: 'pedestrian' | 'forklift' | 'both';
  zoneId?: string;
}

export interface MapEdge {
  id: string;
  versionId: string;
  from: string;
  to: string;
  weight: number;
  isOneWay?: boolean;
  type: 'forklift' | 'pedestrian' | 'shared';
  speedLimit?: number;
}

export type EventType = 'incident' | 'near_miss' | 'congestion' | 'dwell' | 'observation' | 'receiving' | 'putaway' | 'replenishment' | 'picking' | 'shipping' | 'returns' | 'battery_change' | 'internal_transfer';

export interface MapEvent {
  id: string;
  type: EventType;
  x: number;
  y: number;
  timestamp: string;
  severity: number; // 1-10
  description?: string;
  zoneId?: string;
  actionId?: string;
}

export interface EngineeringInsight {
  id: string;
  facilityId: string;
  versionId?: string;
  type: 'safety_hotspot' | 'travel_inefficiency' | 'bottleneck' | 'interaction_risk';
  category: 'EHS' | 'IE';
  severity: number;
  score: number;
  details: Record<string, any>;
  x?: number;
  y?: number;
  createdAt: string;
}

export interface Observation {
  id: string;
  facilityId: string;
  type: 'safety' | 'efficiency' | 'hazard';
  severity: number;
  status: 'open' | 'reviewed' | 'resolved';
  x?: number;
  y?: number;
  zoneId?: string;
  nodeId?: string;
  description: string;
  reporterId?: string;
  timestamp: string;
  media?: string[]; // URLs
}

export interface ActionItem {
  id: string;
  observationId?: string;
  title: string;
  description?: string;
  zone?: string;
  category: string;
  owner: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Verified' | 'Cancelled';
  verifiedAt?: string;
  verifiedBy?: string;
  effectivenessScore?: number;
  effectivenessNotes?: string;
  createdAt: string;
}

export interface LaborRecord {
  id: string;
  facilityId: string;
  operatorId?: string;
  activityType: string;
  startTime: string;
  endTime?: string;
  actualPicks: number;
  expectedPicks: number;
  equipmentId?: string;
}

export interface CostAssumption {
  id: string;
  facilityId: string;
  category: string;
  key: string;
  value: number;
  unit?: string;
  effectiveDate: string;
}

export interface SimulationResult {
  path: MapNode[];
  distance: number;
  estimatedTime: number;
  riskScore: number;
  conflictCount?: number;
  totalTime?: number;
  activityEfficiency?: number;
  warnings: string[];
}
