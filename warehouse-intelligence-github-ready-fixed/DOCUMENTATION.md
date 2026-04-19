# Warehouse Heatmap & Route Intelligence Platform

## 1. Product Overview
The Warehouse Heatmap & Route Intelligence Platform is an advanced decision-support system designed for Safety Engineers, Industrial Engineers, and Operations Leaders. It bridges the gap between static floorplans and dynamic operational reality. By combining multi-layer heatmaps, route simulation, and what-if scenario modeling, the platform enables data-driven decisions to reduce forklift-pedestrian conflicts, eliminate congestion, optimize travel paths, and justify capital improvements.

## 2. Recommended Architecture and Tech Stack
- **Frontend Framework:** React 19 + TypeScript + Vite
- **State Management:** Zustand (for global map state, simulation state, and user sessions)
- **Routing:** React Router v7
- **Visualization (Map):** React-Konva (HTML5 Canvas) for high-performance rendering of floorplans, zones, heatmaps, and route paths with zoom/pan capabilities.
- **Visualization (Charts):** Recharts for responsive, composable analytics dashboards.
- **Styling:** Tailwind CSS v4 for utility-first, maintainable design.
- **Backend/API (Future/Conceptual):** Node.js/Express service layer with REST/GraphQL APIs.
- **Database (Conceptual):** PostgreSQL (relational data for users, zones, scenarios) + TimescaleDB or ClickHouse (for high-volume event/telemetry data).
- **Authentication:** Role-based Access Control (RBAC) via JWT/OAuth2.

## 3. User Roles and Permissions Matrix
| Role | Map Edit | Scenarios | Route Sim | Heatmaps | Upload Data | Admin Config |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin** | Full | Full | Full | Full | Full | Full |
| **Safety Engineer** | Safety Layers | Safety Scenarios| Yes | Full | Incidents | No |
| **Industrial Engineer**| Layout/Routes | Full | Full | Full | IE Data | No |
| **Operations Leader** | View Only | View/Approve | View | Full | No | No |
| **Supervisor** | View Only | View | View | Assigned | Limited | No |
| **Viewer** | View Only | View | View | View | No | No |

## 4. Screen-by-Screen App Structure
1. **Executive Dashboard:** High-level KPIs, top hot zones, congestion trends, and recent scenario savings.
2. **Map Workspace:** Interactive canvas to view the floorplan, toggle layers (zones, paths, heatmaps), and edit map objects (Admin/IE).
3. **Heatmap Analytics:** Controls to filter and overlay different heatmap types (traffic, near-misses, congestion) with linked trend charts.
4. **Route Simulation Studio:** Define start/end points, equipment types, and rules to simulate travel paths, calculating distance, time, and conflict exposure.
5. **Scenario Modeling:** Side-by-side comparison of Baseline vs. Future State (e.g., moving staging lanes) with quantified delta metrics.
6. **Safety Dashboard:** Focused view on pedestrian interactions, near misses, blind corners, and high-risk crossings.
7. **IE Dashboard:** Focused view on wasted travel, route inefficiency, touches, and layout friction points.
8. **Admin / Configuration:** User management, facility setup, import mapping, and audit logs.

## 5. Data Model / Schema (Core Entities)
- **Facility:** `id`, `name`, `dimensions`, `scale_factor`, `image_url`
- **Zone:** `id`, `facility_id`, `name`, `type` (aisle, dock, staging, staging_lane, dock_lane, battery_area, blind_corner, pedestrian, protected_walkway, barrier, crossing), `geometry` (x, y, w, h, points), `properties`, `is_one_way`
- **Path/Node:** `id`, `facility_id`, `type` (standard, intersection, hazard_point, crossing_point, dock_door, rack_face), `coordinates`, `allowed_traffic` (forklift, pedestrian, both)
- **Event:** `id`, `facility_id`, `type` (receiving, putaway, replenishment, picking, shipping, returns, battery_change, incident, near_miss, congestion), `x`, `y`, `timestamp`, `severity`, `metadata`
- **Activity Classes:** Linked to route analysis (`receiving`, `picking`, `battery_change`, etc.) with specialized routing weights.
- **Scenario:** `id`, `name`, `baseline_id`, `changes` (JSON patch), `created_by`
- **SimulationRun:** `id`, `scenario_id`, `start_node`, `end_node`, `equipment_type`, `metrics` (distance, time, risk_score)

## 6. Map Interaction Design
- **Canvas-Based:** Uses Konva.js for smooth zooming and panning.
- **Layers:** Background Image -> Grid -> Zones -> Paths -> Heatmap Overlay -> Route Simulation Overlay -> Annotations.
- **Interactivity:** Click a zone to open a detail panel (showing area, incidents, congestion score). Drag-and-drop for authorized users to edit zone boundaries.
- **Snapping:** Grid snapping for precise alignment of racks and aisles.

## 7. Heatmap Calculation Model
- **Grid Aggregation:** The map is divided into a hidden grid (e.g., 1m x 1m cells).
- **Scoring:** Each event type has a weight (Incident = 10, Near Miss = 5, Congestion = 2).
- **Decay:** Spatial decay (Gaussian blur) is applied so a near-miss affects surrounding cells, decreasing with distance.
- **Normalization:** Raw scores are normalized to a 0-100 scale for color mapping (Blue -> Green -> Yellow -> Red).

## 8. Route Simulation Logic Approach
- **Graph Network:** The warehouse paths are modeled as a directed weighted graph.
- **Pathfinding:** A* or Dijkstra's algorithm calculates the optimal route.
- **Cost Function:** `Cost = (Distance / Speed) + Penalties`.
- **Penalties:** Added for crossing pedestrian paths, navigating blind corners, or entering high-congestion zones.
- **Output:** Generates a polyline on the map and calculates total estimated time and risk exposure.

## 9. Scenario Modeling Approach
- **Copy-on-Write:** A scenario clones the baseline map state.
- **Delta Tracking:** Only changes (e.g., Zone A moved, Path B made one-way) are stored.
- **Comparative Simulation:** Route simulations are run against both the baseline graph and the scenario graph to calculate savings in travel time and risk reduction.

## 10. Dashboard Design
- **Layout:** Top KPI cards, main chart area (time-series trends), secondary charts (bar charts for zone rankings), and a mini-map for spatial context.
- **Interactivity:** Cross-filtering (clicking a bar filters the mini-map and other charts).

## 11. Validation and Error-Handling Rules
- **Map:** Zones cannot have negative dimensions. Paths must connect to existing nodes.
- **Simulation:** Start and end points must be valid, navigable nodes.
- **Data Import:** CSV uploads must contain required headers (`timestamp`, `x`, `y`, `type`). Invalid rows are flagged in a pre-import preview.

## 12. Admin Tools and Audit Logging
- **Audit Log:** Every mutation (create zone, run simulation, change permissions) writes to an append-only `audit_logs` table with `user_id`, `action`, `entity`, `timestamp`, and `diff`.

## 13. System Security & Hardening (Implemented)
- **Environment Context Validation:** Strict Zod validation of all environment variables (JWT_SECRET, PORT, etc.) at startup.
- **Rate Limiting:** Global API throttling and dedicated brute-force protection for login/register endpoints.
- **Request Validation:** Every data mutation endpoint (POST/PUT/PATCH) is strictly validated against Zod schemas.
- **RBAC Enforcement:** Role-based access control is verified at the middleware layer with audit trail logging for forbidden access attempts.
- **Audit Trail:** Comprehensive logging of all system changes including entity type, action, user ID, and identifying metadata.

## 14. Phased Implementation Plan (Status)
### Implemented
- **Data Ingestion Center:** Wizard-based CSV/Excel imports with staging and validation.
- **Engineering Console:** Safety hotspot clustering, Interaction risk detection, and IE efficiency analytics.
- **Verification Loop:** Formal effectiveness review and scoring for completed engineering actions.
- **Production Hardening:** Secure auth, rate limiting, and request validation.

### Roadmap (Future)
- **Phase A (Immediate):** Batch retry support for failed import staging rows.
- **Phase B (Mid-term):** Live RTLS (Real-Time Location System) integration for forklift dots.
- **Phase C (Long-term):** Predictive AI for bottleneck forecasting based on historical shift tasks.

## 15. Stretch Roadmap (Digital Twin)
- **Live RTLS Overlay:** Real-time dots moving on the map representing forklifts.
- **Predictive Congestion:** AI predicting bottlenecks 30 minutes in advance based on current shift volume.
- **Automated Slotting:** System suggests moving SKUs based on actual travel paths, not just theoretical ABC analysis.

## 16. Build-Ready Code Structure
The application code implements the foundation of this platform, including the map workspace, routing simulation UI, and dashboard layouts using React, Zustand, and Konva.
