import { initializeDatabase, getDb } from '../../src/lib/db.js';
import { SCHEMA_DDL } from './schema.js';
import bcrypt from 'bcryptjs';
import path from 'path';

export function bootstrap() {
  console.log('[BOOTSTRAP] Checking system state...');
  try {
    const dbPath = path.join(process.cwd(), 'warehouse.db');
    
    // 0. Initialize DB
    const db = initializeDatabase(dbPath);
    
    // Integrity check
    const integrity = db.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
    if (integrity.integrity_check !== 'ok') {
        throw new Error(`Database integrity check failed: ${integrity.integrity_check}`);
    }
    
    // Run schema creation
    db.exec(SCHEMA_DDL);

    // 1. Users
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
    if (userCount === 0) {
      console.log('[BOOTSTRAP] Seeding admin user...');
      const email = process.env.ADMIN_SEED_EMAIL || 'admin@warehouse.com';
      const rawPassword = process.env.ADMIN_SEED_PASSWORD || 'admin123';
      const pass = bcrypt.hashSync(rawPassword, 10);
      db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)')
        .run('admin-1', 'System Admin', email, pass, 'Admin');
      
      if (!process.env.ADMIN_SEED_EMAIL || !process.env.ADMIN_SEED_PASSWORD) {
        console.warn('[BOOTSTRAP] WARNING: Seeded admin with default credentials. Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD to secure this.');
      }
    }

    // 2. Facilities
    const facilityCount = (db.prepare('SELECT COUNT(*) as count FROM facilities').get() as { count: number }).count;
    if (facilityCount === 0) {
      db.prepare('INSERT INTO facilities (id, name, width, height) VALUES (?, ?, ?, ?)')
        .run('f1', 'Main Distribution Center', 100, 80);
    }
    
    // 3. Map Versions
    const versionCount = (db.prepare('SELECT COUNT(*) as count FROM map_versions').get() as { count: number }).count;
    if (versionCount === 0) {
      console.log('[BOOTSTRAP] Seeding default map version...');
      db.prepare('INSERT INTO map_versions (id, facility_id, name, description, status, is_base_version) VALUES (?, ?, ?, ?, ?, ?)')
        .run('v1', 'f1', 'Original Layout', 'Base configuration from CAD import', 'active', 1);
    }

    // 4. Zones (Operational Map Objects)
    const zoneCount = (db.prepare('SELECT COUNT(*) as count FROM zones').get() as { count: number }).count;
    if (zoneCount === 0 && process.env.NODE_ENV === 'development') {
      const mockZones = [
        { id: 'z1', name: 'Receiving Dock 1-4', type: 'dock', x: 0, y: 0, width: 25, height: 12, color: '#94a3b8', rotation: 0 },
        { id: 'z2', name: 'Dock Lane 1', type: 'dock_lane', x: 0, y: 12, width: 25, height: 5, color: '#fde047', rotation: 0 },
        { id: 'z3', name: 'Staging Area A', type: 'staging', x: 30, y: 0, width: 40, height: 15, color: '#fde047', rotation: 0 },
        { id: 'z4', name: 'Staging Lane 1', type: 'staging_lane', x: 30, y: 15, width: 40, height: 3, color: '#fbbf24', rotation: 0 },
        { id: 'z5', name: 'Aisle 1', type: 'aisle', x: 10, y: 25, width: 6, height: 45, color: '#e2e8f0', rotation: 0 },
        { id: 'z6', name: 'Rack 1A', type: 'rack', x: 16, y: 25, width: 12, height: 45, color: '#64748b', rotation: 0 },
        { id: 'z7', name: 'Battery Area', type: 'battery_area', x: 80, y: 0, width: 20, height: 18, color: '#fca5a5', rotation: 0 },
        { id: 'z8', name: 'Protected Walkway North', type: 'protected_walkway', x: 0, y: 75, width: 100, height: 5, color: '#86efac', rotation: 0 },
        { id: 'z9', name: 'Restricted Hazardous Storage', type: 'restricted', x: 75, y: 20, width: 15, height: 15, color: '#ef4444', rotation: 0 },
        { id: 'z10', name: 'Blind Corner - NW', type: 'blind_corner', x: 5, y: 20, width: 5, height: 5, color: '#f97316', rotation: 0 },
      ];
      const insertStmt = db.prepare('INSERT INTO zones (id, version_id, name, type, x, y, width, height, color, rotation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      db.transaction(() => {
        for (const z of mockZones) insertStmt.run(z.id, 'v1', z.name, z.type, z.x, z.y, z.width, z.height, z.color, z.rotation);
      })();
    }

    // 5. Events (Operational Activities)
    const eventCount = (db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number }).count;
    if (eventCount === 0) {
      const mockEvents = [
        { id: 'e1', type: 'near_miss', x: 12, y: 75, timestamp: '2023-10-01T10:00:00Z', severity: 8, description: 'Near-miss at NW Blind Corner' },
        { id: 'e2', type: 'picking', x: 13, y: 35, timestamp: '2023-10-01T11:00:00Z', severity: 1, description: 'Order Pick - Batch 402' },
        { id: 'e3', type: 'battery_change', x: 90, y: 10, timestamp: '2023-10-01T14:30:00Z', severity: 1, description: 'Scheduled Battery Swap' },
        { id: 'e4', type: 'congestion', x: 25, y: 15, timestamp: '2023-10-02T09:00:00Z', severity: 6, description: 'Forklift queue at dock lane 1' },
         { id: 'e5', type: 'incident', x: 85, y: 15, timestamp: '2023-09-28T14:00:00Z', severity: 9, description: 'Barrier impact in battery area' },
      ];
      const insertStmt = db.prepare('INSERT INTO events (id, type, x, y, timestamp, severity, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
      db.transaction(() => {
        for (const e of mockEvents) insertStmt.run(e.id, e.type, e.x, e.y, e.timestamp, e.severity, e.description);
      })();
    }

    // 6. Network Map (Advanced Travel Network)
    const nodeCount = (db.prepare('SELECT COUNT(*) as count FROM map_nodes').get() as { count: number }).count;
    if (nodeCount === 0) {
      const mockNodes = [
        // Main Spine
        { id: 'n1', x: 13, y: 15, type: 'standard', allowed_traffic: 'forklift' },
        { id: 'n2', x: 13, y: 25, type: 'intersection', allowed_traffic: 'forklift' },
        { id: 'n3', x: 13, y: 75, type: 'crossing_point', allowed_traffic: 'both' },
        // Dock Areas
        { id: 'n4', x: 5, y: 6, type: 'dock_door', allowed_traffic: 'forklift' },
        { id: 'n5', x: 15, y: 6, type: 'dock_door', allowed_traffic: 'forklift' },
        // Pedestrian Network
        { id: 'n6', x: 5, y: 77.5, type: 'standard', allowed_traffic: 'pedestrian' },
        { id: 'n7', x: 13, y: 77.5, type: 'crossing_point', allowed_traffic: 'both' },
        { id: 'n8', x: 95, y: 77.5, type: 'standard', allowed_traffic: 'pedestrian' },
        // High Risk Points
        { id: 'n9', x: 7.5, y: 22.5, type: 'safety_stop', allowed_traffic: 'forklift' },
      ];
      const mockEdges = [
        // Forklift Paths
        { id: 'ed1', from_node: 'n1', to_node: 'n2', weight: 10, type: 'forklift', is_one_way: 1 },
        { id: 'ed2', from_node: 'n2', to_node: 'n3', weight: 50, type: 'forklift', is_one_way: 0 },
        { id: 'ed3', from_node: 'n4', to_node: 'n1', weight: 12, type: 'forklift', is_one_way: 0 },
        { id: 'ed4', from_node: 'n5', to_node: 'n1', weight: 10, type: 'forklift', is_one_way: 0 },
        // Pedestrian Protected Walkway
        { id: 'ed5', from_node: 'n6', to_node: 'n7', weight: 8, type: 'pedestrian', is_one_way: 0 },
        { id: 'ed6', from_node: 'n7', to_node: 'n8', weight: 82, type: 'pedestrian', is_one_way: 0 },
        // Interaction Points
        { id: 'ed7', from_node: 'n3', to_node: 'n7', weight: 2.5, type: 'shared', is_one_way: 0 },
      ];
      const insertNode = db.prepare('INSERT INTO map_nodes (id, version_id, x, y, type, allowed_traffic) VALUES (?, ?, ?, ?, ?, ?)');
      const insertEdge = db.prepare('INSERT INTO map_edges (id, version_id, from_node, to_node, weight, type, is_one_way) VALUES (?, ?, ?, ?, ?, ?, ?)');
      db.transaction(() => {
        for (const n of mockNodes) insertNode.run(n.id, 'v1', n.x, n.y, n.type, n.allowed_traffic);
        for (const e of mockEdges) insertEdge.run(e.id, 'v1', e.from_node, e.to_node, e.weight, e.type, e.is_one_way);
      })();
    }

    console.log('[BOOTSTRAP] System ready.');
  } catch (e: any) {
    if (e.message?.includes('integrity_check') || e.code === 'SQLITE_CORRUPT') {
      console.error('[BOOTSTRAP] CRITICAL: Database file seems corrupted.', e);
      throw new Error('Database is corrupted. Please remove warehouse.db and restart to regenerate.');
    } else {
      console.error('[BOOTSTRAP] Initial checks failed.', e);
      throw e;
    }
  }
}
