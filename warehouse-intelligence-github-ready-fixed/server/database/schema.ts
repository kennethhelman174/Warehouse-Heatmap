
export const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS facilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    width REAL NOT NULL,
    height REAL NOT NULL,
    image_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS map_versions (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    is_base_version INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    FOREIGN KEY(facility_id) REFERENCES facilities(id)
  );

  CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    rotation REAL DEFAULT 0,
    color TEXT,
    metadata_json TEXT,
    FOREIGN KEY(version_id) REFERENCES map_versions(id)
  );

  CREATE TABLE IF NOT EXISTS saved_routes (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    name TEXT NOT NULL,
    path_json TEXT NOT NULL,
    metrics_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    FOREIGN KEY(facility_id) REFERENCES facilities(id),
    FOREIGN KEY(version_id) REFERENCES map_versions(id)
  );

  CREATE TABLE IF NOT EXISTS racks (
    id TEXT PRIMARY KEY,
    zone_id TEXT NOT NULL,
    name TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    depth REAL,
    levels INTEGER DEFAULT 1,
    bays INTEGER DEFAULT 1,
    capacity REAL,
    status TEXT DEFAULT 'active',
    FOREIGN KEY(zone_id) REFERENCES zones(id)
  );

  CREATE TABLE IF NOT EXISTS rack_locations (
    id TEXT PRIMARY KEY,
    rack_id TEXT,
    aisle TEXT,
    row TEXT,
    bay TEXT,
    level TEXT,
    slot TEXT,
    location_code TEXT UNIQUE,
    rack_type TEXT,
    FOREIGN KEY(rack_id) REFERENCES racks(id)
  );

  CREATE TABLE IF NOT EXISTS location_stats (
    location_id TEXT PRIMARY KEY,
    picks INTEGER DEFAULT 0,
    incidents INTEGER DEFAULT 0,
    occupancy_status TEXT,
    last_cycle_count TEXT,
    FOREIGN KEY(location_id) REFERENCES rack_locations(id)
  );

  CREATE TABLE IF NOT EXISTS map_nodes (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    type TEXT,
    allowed_traffic TEXT,
    zone_id TEXT,
    FOREIGN KEY(version_id) REFERENCES map_versions(id),
    FOREIGN KEY(zone_id) REFERENCES zones(id)
  );

  CREATE TABLE IF NOT EXISTS map_edges (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    from_node TEXT NOT NULL,
    to_node TEXT NOT NULL,
    weight REAL NOT NULL,
    is_one_way INTEGER DEFAULT 0,
    type TEXT NOT NULL,
    speed_limit REAL,
    FOREIGN KEY(version_id) REFERENCES map_versions(id),
    FOREIGN KEY(from_node) REFERENCES map_nodes(id),
    FOREIGN KEY(to_node) REFERENCES map_nodes(id)
  );

  CREATE TABLE IF NOT EXISTS observations (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL,
    type TEXT NOT NULL,
    severity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'open',
    x REAL,
    y REAL,
    zone_id TEXT,
    node_id TEXT,
    description TEXT,
    reporter_id TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY(facility_id) REFERENCES facilities(id),
    FOREIGN KEY(zone_id) REFERENCES zones(id),
    FOREIGN KEY(node_id) REFERENCES map_nodes(id)
  );

  CREATE TABLE IF NOT EXISTS observation_media (
    id TEXT PRIMARY KEY,
    observation_id TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(observation_id) REFERENCES observations(id)
  );

  CREATE TABLE IF NOT EXISTS action_items (
    id TEXT PRIMARY KEY,
    observation_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    zone TEXT,
    category TEXT NOT NULL,
    owner TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    due_date TEXT NOT NULL,
    status TEXT NOT NULL,
    verified_at TEXT,
    verified_by TEXT,
    effectiveness_score INTEGER,
    effectiveness_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(observation_id) REFERENCES observations(id)
  );

  CREATE TABLE IF NOT EXISTS engineering_insights (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL,
    version_id TEXT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    severity INTEGER DEFAULT 1,
    score REAL NOT NULL,
    details_json TEXT,
    x REAL,
    y REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(facility_id) REFERENCES facilities(id),
    FOREIGN KEY(version_id) REFERENCES map_versions(id)
  );

  CREATE TABLE IF NOT EXISTS action_history (
    id TEXT PRIMARY KEY,
    action_item_id TEXT NOT NULL,
    status_from TEXT,
    status_to TEXT,
    comment TEXT,
    updated_by TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(action_item_id) REFERENCES action_items(id)
  );

  CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_version_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    FOREIGN KEY(facility_id) REFERENCES facilities(id),
    FOREIGN KEY(base_version_id) REFERENCES map_versions(id)
  );

  CREATE TABLE IF NOT EXISTS scenario_runs (
    id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    parameters_json TEXT,
    results_json TEXT,
    started_at TEXT,
    completed_at TEXT,
    FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
  );

  CREATE TABLE IF NOT EXISTS labor_records (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL,
    operator_id TEXT,
    activity_type TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    actual_picks INTEGER DEFAULT 0,
    expected_picks INTEGER DEFAULT 0,
    equipment_id TEXT,
    FOREIGN KEY(facility_id) REFERENCES facilities(id)
  );

  CREATE TABLE IF NOT EXISTS labor_plans (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL,
    date TEXT NOT NULL,
    shift TEXT,
    headcount_target INTEGER,
    volume_target INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(facility_id) REFERENCES facilities(id)
  );

  CREATE TABLE IF NOT EXISTS cost_assumptions (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT,
    effective_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(facility_id) REFERENCES facilities(id)
  );

  CREATE TABLE IF NOT EXISTS benchmark_snapshots (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL,
    metric_key TEXT NOT NULL,
    value REAL NOT NULL,
    period TEXT NOT NULL,
    compared_to_industry REAL,
    FOREIGN KEY(facility_id) REFERENCES facilities(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS route_templates (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    name TEXT NOT NULL,
    start_node_id TEXT NOT NULL,
    end_node_id TEXT NOT NULL,
    equipment_type TEXT,
    FOREIGN KEY(facility_id) REFERENCES facilities(id),
    FOREIGN KEY(version_id) REFERENCES map_versions(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    timestamp TEXT NOT NULL,
    severity INTEGER NOT NULL,
    description TEXT,
    zone_id TEXT,
    action_id TEXT,
    facility_id TEXT,
    FOREIGN KEY(zone_id) REFERENCES zones(id),
    FOREIGN KEY(facility_id) REFERENCES facilities(id)
  );
  
  CREATE TABLE IF NOT EXISTS import_jobs (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    status TEXT NOT NULL,
    total_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS import_validation_errors (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    row_number INTEGER,
    error_message TEXT NOT NULL,
    raw_data TEXT,
    FOREIGN KEY(job_id) REFERENCES import_jobs(id)
  );

  CREATE TABLE IF NOT EXISTS import_staging_rows (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    row_number INTEGER NOT NULL,
    data_json TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY(job_id) REFERENCES import_jobs(id)
  );
`;
