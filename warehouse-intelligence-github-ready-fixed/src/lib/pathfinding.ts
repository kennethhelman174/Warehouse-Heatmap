import { MapNode, MapEdge, MapEvent, SimulationResult, Zone } from '../types';

export type RoutingMode = 'shortest' | 'safest' | 'balanced';

export interface RouteSegment {
  id: string;
  fromNode: string;
  toNode: string;
  distance: number;
  type: string;
  riskFactor: number;
  warnings: string[];
}

export interface AdvancedRouteResult extends SimulationResult {
  segments: RouteSegment[];
  conflictCount: number;
  totalTime: number; // in seconds
  activityEfficiency: number; // 0-1 score
}

// Penalty Constants (Time in seconds equivalent)
const PENALTIES = {
  CROSSING: 8,
  BLIND_CORNER: 12,
  DOCK_CONGESTION: 20,
  HAZARD_ZONE: 25,
  ONE_WAY_VIOLATION: 1000, // Effectively infinite
  CONGESTION_EVENT: 15,
  DWELL_EVENT: 30,
  BATTERY_AREA_ACCESS: 10,
  SHARED_ZONE_CONFLICT: 5
};

export function getDistance(p1: { x: number, y: number }, p2: { x: number, y: number }) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Advanced Warehouse Routing Engine (A* Implementation)
 */
export function findPath(
  startNodeId: string, 
  endNodeId: string, 
  nodes: MapNode[], 
  edges: MapEdge[], 
  zones: Zone[],
  events: MapEvent[] = [],
  mode: RoutingMode = 'balanced',
  equipmentType: 'forklift' | 'pedestrian' = 'forklift',
  activityType: string = 'picking'
): AdvancedRouteResult {
  const startNode = nodes.find(n => n.id === startNodeId);
  const endNode = nodes.find(n => n.id === endNodeId);

  if (!startNode || !endNode) {
    return createEmptyResult('Invalid start or end location');
  }

  // Cost and heuristic maps
  const gScore = new Map<string, number>(); // Cost from start
  const fScore = new Map<string, number>(); // gScore + heuristic
  const parent = new Map<string, string | null>();
  const openSet = new Set<string>([startNodeId]);

  nodes.forEach(node => {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
  });

  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, getDistance(startNode, endNode));

  while (openSet.size > 0) {
    // Get node in openSet with lowest fScore
    let currentId = Array.from(openSet).reduce((a, b) => 
      (fScore.get(a) || Infinity) < (fScore.get(b) || Infinity) ? a : b
    );

    if (currentId === endNodeId) break;

    openSet.delete(currentId);
    const currentNode = nodes.find(n => n.id === currentId)!;

    // Get neighbors
    const outgoingEdges = edges.filter(e => {
      // Directionality check
      const isFrom = e.from === currentId;
      const isToBidirectional = !e.isOneWay && e.to === currentId;
      if (!isFrom && !isToBidirectional) return false;

      // Access restrictions
      if (equipmentType === 'forklift' && e.type === 'pedestrian') return false;
      if (equipmentType === 'pedestrian' && e.type === 'forklift') return false;
      
      // Node-level restrictions
      const targetId = e.from === currentId ? e.to : e.from;
      const targetNode = nodes.find(n => n.id === targetId);
      if (targetNode?.allowedTraffic && targetNode.allowedTraffic !== 'both') {
        if (targetNode.allowedTraffic !== equipmentType) return false;
      }

      return true;
    });

    for (const edge of outgoingEdges) {
      const neighborId = edge.from === currentId ? edge.to : edge.from;
      const neighborNode = nodes.find(n => n.id === neighborId)!;

      // Base weight: Euclidean distance
      const dist = getDistance(currentNode, neighborNode);
      
      // Calculate travel time (seconds)
      const speed = edge.speedLimit || (equipmentType === 'forklift' ? 3.0 : 1.2);
      let travelTime = dist / speed;

      // Apply Engineering Penalties (Operational Context)
      let penalty = 0;

      // 1. Structural Penalties
      if (neighborNode.type === 'crossing_point') penalty += PENALTIES.CROSSING;
      if (neighborNode.type === 'hazard_point') penalty += PENALTIES.HAZARD_ZONE;
      if (neighborNode.type === 'intersection') penalty += 3; // Basic slowing at stops

      // 2. Spatial/Zone Penalties
      const nearbyZones = zones.filter(z => 
        neighborNode.x >= z.x - 1 && neighborNode.x <= z.x + z.width + 1 &&
        neighborNode.y >= z.y - 1 && neighborNode.y <= z.y + z.height + 1
      );

      nearbyZones.forEach(z => {
        if (z.type === 'blind_corner') penalty += PENALTIES.BLIND_CORNER;
        if (z.type === 'restricted') penalty += 50; // Heavy discouragement
        if (z.type === 'battery_area' && activityType !== 'battery_change') penalty += PENALTIES.BATTERY_AREA_ACCESS;
      });

      // 3. Activity Context
      if (activityType === 'picking' && edge.type === 'shared') penalty += PENALTIES.SHARED_ZONE_CONFLICT;

      // 4. Real-time/Event Congestion
      const localEvents = events.filter(e => getDistance(e, neighborNode) < 3);
      localEvents.forEach(e => {
        if (e.type === 'congestion') penalty += PENALTIES.CONGESTION_EVENT;
        if (e.type === 'dwell') penalty += PENALTIES.DWELL_EVENT;
        if (e.type === 'incident') penalty += 100; // Major avoidance
      });

      // Combine factors based on Mode
      let finalEdgeWeight = travelTime;
      if (mode === 'safest') {
        finalEdgeWeight = travelTime + (penalty * 3);
      } else if (mode === 'balanced') {
        finalEdgeWeight = travelTime + (penalty * 1.5);
      } else {
        finalEdgeWeight = travelTime + (penalty * 0.2); // Shortest still cares slightly about safety
      }

      const tentativeGScore = (gScore.get(currentId) || Infinity) + finalEdgeWeight;

      if (tentativeGScore < (gScore.get(neighborId) || Infinity)) {
        parent.set(neighborId, currentId);
        gScore.set(neighborId, tentativeGScore);
        fScore.set(neighborId, tentativeGScore + getDistance(neighborNode, endNode));
        openSet.add(neighborId);
      }
    }
  }

  // Backtrack to build path
  const pathNodes: MapNode[] = [];
  let curr: string | null = endNodeId;
  while (curr) {
    const node = nodes.find(n => n.id === curr);
    if (node) pathNodes.unshift(node);
    curr = parent.get(curr) || null;
  }

  if (pathNodes.length === 0 || pathNodes[0].id !== startNodeId) {
    return createEmptyResult('Operational failure: No valid route found for current equipment/restrictions');
  }

  // Detailed Analysis Post-Processing
  const segments: RouteSegment[] = [];
  let totalDistance = 0;
  let totalRisk = 0;
  let conflicts = 0;
  let totalTimeSeconds = 0;
  const warningsSet = new Set<string>();

  for (let i = 0; i < pathNodes.length - 1; i++) {
    const from = pathNodes[i];
    const to = pathNodes[i+1];
    const edge = edges.find(e => 
      (e.from === from.id && e.to === to.id) || 
      (!e.isOneWay && e.from === to.id && e.to === from.id)
    )!;

    const segmentDist = getDistance(from, to);
    totalDistance += segmentDist;
    
    // Calculate segment metrics
    const speed = edge.speedLimit || (equipmentType === 'forklift' ? 3 : 1.2);
    const baseTime = segmentDist / speed;
    let segmentWarnings: string[] = [];

    // Safety Auditing
    if (to.type === 'intersection') conflicts++;
    if (to.type === 'hazard_point') {
      totalRisk += 20;
      segmentWarnings.push('Entering high-hazard zone');
    }
    if (edge.type === 'shared' && equipmentType === 'forklift') {
      totalRisk += 5;
      segmentWarnings.push('Shared traffic lane');
    }

    // Zone awareness
    const activeZones = zones.filter(z => 
      to.x >= z.x && to.x <= z.x + z.width &&
      to.y >= z.y && to.y <= z.y + z.height
    );
    activeZones.forEach(z => {
      if (z.type === 'blind_corner') {
        totalRisk += 15;
        segmentWarnings.push('Blind corner intersection');
      }
      if (z.type === 'restricted') warningsSet.add('Route traverses restricted access area');
    });

    totalTimeSeconds += baseTime;

    segments.push({
      id: edge.id,
      fromNode: from.id,
      toNode: to.id,
      distance: Math.round(segmentDist * 10) / 10,
      type: edge.type,
      riskFactor: Math.min(100, Math.round(totalRisk / (i + 1) * 10)), // Rolling risk
      warnings: segmentWarnings
    });

    segmentWarnings.forEach(w => warningsSet.add(w));
  }

  return {
    path: pathNodes,
    distance: Math.round(totalDistance),
    estimatedTime: Math.round(totalTimeSeconds),
    riskScore: Math.round(totalRisk),
    warnings: Array.from(warningsSet),
    segments,
    conflictCount: conflicts,
    totalTime: Math.round(totalTimeSeconds),
    activityEfficiency: Math.max(0.1, 1 - (totalTimeSeconds / (totalDistance / 1.5) / 5)) // Heuristic
  };
}

function createEmptyResult(error: string): AdvancedRouteResult {
  return {
    path: [],
    distance: 0,
    estimatedTime: 0,
    riskScore: 100,
    warnings: [error],
    segments: [],
    conflictCount: 0,
    totalTime: 0,
    activityEfficiency: 0
  };
}
