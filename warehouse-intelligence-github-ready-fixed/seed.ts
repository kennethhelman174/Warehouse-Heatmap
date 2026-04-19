import bcrypt from 'bcryptjs';
import { initializeDatabase, getDb } from './src/lib/db.js';
import path from 'path';

async function seed() {
  const dbPath = path.join(process.cwd(), 'warehouse.db');
  initializeDatabase(dbPath);
  const db = getDb();
  
  console.log('Seeding database...');

  // Clear existing data
  db.prepare('DELETE FROM users').run();
  db.prepare('DELETE FROM zones').run();
  db.prepare('DELETE FROM events').run();

  const adminPassword = bcrypt.hashSync('admin123', 10);
  
  const insertUser = db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('1', 'Admin User', 'admin@warehouse.com', adminPassword, 'Admin');

  const zones = [
    { id: 'z1', name: 'Receiving Dock', type: 'dock', x: 10, y: 10, width: 20, height: 15, color: 'rgba(59, 130, 246, 0.2)' },
    { id: 'z2', name: 'Aisle 1', type: 'aisle', x: 40, y: 10, width: 5, height: 60, color: 'rgba(16, 185, 129, 0.2)' },
    { id: 'z3', name: 'Aisle 2', type: 'aisle', x: 55, y: 10, width: 5, height: 60, color: 'rgba(16, 185, 129, 0.2)' },
    { id: 'z4', name: 'Shipping Dock', type: 'dock', x: 80, y: 10, width: 15, height: 20, color: 'rgba(239, 68, 68, 0.2)' }
  ];

  const insertZone = db.prepare('INSERT INTO zones (id, name, type, x, y, width, height, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const zone of zones) {
    insertZone.run(zone.id, zone.name, zone.type, zone.x, zone.y, zone.width, zone.height, zone.color);
  }

  const events = [
    { id: 'e1', type: 'incident', x: 42, y: 25, timestamp: new Date().toISOString(), severity: 8, description: 'Forklift collision' },
    { id: 'e2', type: 'near_miss', x: 57, y: 45, timestamp: new Date().toISOString(), severity: 4, description: 'Pedestrian near miss' },
    { id: 'e3', type: 'congestion', x: 15, y: 15, timestamp: new Date().toISOString(), severity: 6, description: 'Dock bottleneck' }
  ];

  const insertEvent = db.prepare('INSERT INTO events (id, type, x, y, timestamp, severity, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const event of events) {
    insertEvent.run(event.id, event.type, event.x, event.y, event.timestamp, event.severity, event.description);
  }

  const insertRack = db.prepare('INSERT INTO rack_locations (id, aisle, row, bay, level, slot, location_code, rack_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (let i = 0; i < 50; i++) {
    insertRack.run(
      `r-${i}`, 'Aisle 1', 'Row A', `Bay ${Math.floor(i/5)}`, `Level ${i%5}`, `Slot ${i}`, `A1-A-${Math.floor(i/5)}-${i%5}`, 'selective'
    );
  }
  
  const insertStats = db.prepare('INSERT INTO location_stats (location_id, picks, incidents) VALUES (?, ?, ?)');
  for (let i = 0; i < 50; i++) {
    insertStats.run(`r-${i}`, Math.floor(Math.random() * 100), Math.floor(Math.random() * 5));
  }

  console.log('Database seeded successfully');
}

seed();
