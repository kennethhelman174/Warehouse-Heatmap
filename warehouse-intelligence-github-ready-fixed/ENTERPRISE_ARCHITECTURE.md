# Enterprise Warehouse Operations Intelligence Platform

## 1. Overview of Advanced Additions
The platform is evolving from a visual heatmap and route simulation tool into a comprehensive, enterprise-grade decision-support system. The new modules bridge the gap between spatial analytics and operational execution:
- **Labor Overlay:** Aligns staffing levels with physical activity density to identify imbalances.
- **Cost Impact Modeling:** Translates spatial inefficiencies (excess travel, congestion) into financial metrics to justify capital and process improvements.
- **Action Tracker:** Closes the loop by turning insights into managed, trackable execution tasks.
- **Mobile Observation Tool:** Empowers floor supervisors to log hazards and inefficiencies directly onto the digital twin in real-time.
- **Multi-Site Benchmarking:** Normalizes KPIs across the network to identify top performers and systemic risks.

## 2. Updated Product Architecture
- **Presentation Layer:** React 19, Tailwind CSS, Zustand (State), React-Konva (Canvas), Recharts.
- **Application Layer:** Modular feature slices (Map, Heatmap, Simulation, Labor, Cost, Actions, Observations, Benchmarking).
- **Integration Layer:** Adapter-based ingestion framework for WMS, Telematics, LMS, and RTLS data.
- **Data Layer:** Normalized relational/document models supporting spatial queries, time-series events, and hierarchical facility structures.

## 3. Updated Roles and Permissions
- **Corporate Executive:** Multi-site benchmarking, aggregated cost opportunities, read-only action tracking.
- **Site Leadership:** Single-site dashboards, cost modeling approval, high-level labor/safety metrics.
- **Industrial Engineer:** Full access to route simulation, cost modeling, labor overlay, and scenario generation.
- **Safety Engineer:** Full access to safety heatmaps, mobile observations triage, and safety action tracking.
- **Operations Manager:** Labor overlay analysis, action assignment/approval, dock/yard flow impacts.
- **Supervisor:** Mobile observation entry, action status updates, shift-level labor views.

## 4. New/Updated Screens and Workflows
- **Labor Planning:** Map overlay toggles for labor density vs. travel heat, staffing imbalance scorecards.
- **Cost Modeling:** Configuration matrix for labor/equipment rates, scenario ROI calculators.
- **Action Tracker:** Kanban/List views of improvement tasks, linked to specific map zones.
- **Mobile Observations:** Touch-optimized form for logging field issues with map-pinning.
- **Benchmarking:** Multi-site scorecards with normalized KPIs (e.g., incidents per 10k sq ft).

## 5. Data Model Additions
```typescript
// Core Entities
interface Facility { id: string; name: string; sqft: number; type: string; }
interface LaborRecord { id: string; zoneId: string; role: string; headcount: number; shift: string; timestamp: Date; }
interface CostAssumption { id: string; facilityId: string; category: string; hourlyRate: number; }
interface ActionItem { id: string; title: string; zoneId: string; ownerId: string; status: ActionStatus; category: string; }
interface Observation { id: string; type: string; severity: number; x: number; y: number; description: string; reporterId: string; }
```

## 6. Labor Overlay Design and Calculations
- **Logic:** Overlay `LaborRecord` density against `Event` (travel/pick) density.
- **Metrics:** 
  - *Labor-to-Activity Ratio:* (Total Tasks in Zone) / (Labor Hours in Zone).
  - *Imbalance Score:* Deviation from baseline ratio, highlighting over/under-staffed zones.

## 7. Cost Impact Modeling Logic
- **Wasted Travel Cost:** (Excess Distance / Avg Speed) * (Blended Labor + Equipment Hourly Rate).
- **Congestion Cost:** (Dwell Time > Threshold) * (Blended Rate).
- **Safety Exposure:** (Near Miss Count) * (Statistical Cost per Near Miss).

## 8. Action Tracker Workflow and Schema
- **Workflow:** Insight -> Draft Action -> Assign -> In Progress -> Verify -> Closed.
- **Schema:** Links directly to `Zone` or `Observation` IDs for spatial context.

## 9. Mobile Observation UX and Workflow
- **UX:** Large tap targets, geolocation/map-tap for coordinates, photo upload, offline-capable caching.
- **Workflow:** Supervisor observes -> Taps map -> Selects category (Hazard/Congestion) -> Submits -> Safety Engineer triages -> Converts to Action.

## 10. Multi-Site Benchmarking Model
- **Normalization:** Metrics divided by facility square footage, total labor hours, or throughput volume.
- **Scoring:** Z-score calculation across the facility peer group to rank performance.

## 11. Integration Design for Future Data Sources
- **WMS:** Ingest task origin/destination for route generation.
- **Telematics:** Ingest forklift breadcrumbs for actual travel paths and impact events.
- **LMS:** Ingest shift rosters and zone assignments.
- **RTLS:** High-frequency coordinate streams for precise congestion mapping.

## 12. Validation Rules
- Actions must have an owner and due date before moving to 'In Progress'.
- Observations must have a valid coordinate (x,y) or Zone ID.
- Cost assumptions must be approved by Site Leadership before applying to Scenarios.

## 13. Dashboard/Reporting Additions
- **Executive:** Network-wide ROI from implemented scenarios.
- **Safety:** Observation resolution time, hotspot trends.
- **IE:** Labor utilization heatmaps, scenario cost-benefit analysis.

## 14. Audit Logging Requirements
- Track all state changes on `ActionItem` and `CostAssumption`.
- Log user, timestamp, previous state, and new state.

## 15. Phased Implementation Plan
- **Phase 1:** Action Tracker & Mobile Observations (High visibility, quick wins).
- **Phase 2:** Labor Overlay & Cost Modeling (Deep analytics).
- **Phase 3:** Multi-Site Benchmarking & Automated Integrations.

## 16. Build-Ready Technical Blueprint
- Implement new routes in `App.tsx`.
- Create Zustand slices for `useActionStore`, `useObservationStore`, `useCostStore`.
- Build UI components using the established "Frosted Glass" theme.
