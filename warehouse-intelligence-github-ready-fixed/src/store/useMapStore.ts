import { create } from 'zustand';
import { Zone, MapEvent, MapNode, MapEdge, MapVersion, EngineeringInsight, Observation, ActionItem } from '../types';
import { 
  zoneApi, eventApi, networkApi, facilityApi, 
  observationApi, actionApi, engineeringApi, routeApi 
} from '../services/api';

export type MapTool = 'pan' | 'select' | 'zone' | 'path' | 'node' | 'barrier' | 'crossing' | 'restricted' | 'blind_corner' | 'rack';

interface MapState {
  facilityId: string | null;
  currentVersionId: string | null;
  mapVersions: MapVersion[];
  zones: Zone[];
  events: MapEvent[];
  observations: Observation[];
  actions: ActionItem[];
  insights: EngineeringInsight[];
  nodes: MapNode[];
  edges: MapEdge[];
  simulatedPath: { x: number, y: number }[] | null;
  savedRoutes: any[];
  selectedId: string | null;
  selectedType: 'zone' | 'node' | 'edge' | 'event' | null;
  isLoading: boolean;
  error: string | null;
  isSnapEnabled: boolean;
  gridSize: number;
  
  // Actions
  setFacilityId: (id: string | null) => void;
  setCurrentVersion: (id: string | null) => void;
  fetchData: (versionId?: string) => Promise<void>;
  fetchVersions: (facilityId: string) => Promise<void>;
  
  // Zone Actions
  setZones: (zones: Zone[]) => void;
  addZone: (zone: Zone) => Promise<void>;
  removeZone: (id: string) => Promise<void>;
  updateZone: (id: string, updates: Partial<Zone>) => Promise<void>;
  
  // Network Actions
  addNode: (node: MapNode) => Promise<void>;
  updateNode: (id: string, updates: Partial<MapNode>) => Promise<void>;
  removeNode: (id: string) => Promise<void>;
  addEdge: (edge: MapEdge) => Promise<void>;
  removeEdge: (id: string) => Promise<void>;
  
  // Selection
  setSelected: (id: string | null, type: 'zone' | 'node' | 'edge' | 'event' | null) => void;
  
  // Settings
  setSnapEnabled: (enabled: boolean) => void;
  setGridSize: (size: number) => void;
  
  setEvents: (events: MapEvent[]) => void;
  setSimulatedPath: (path: { x: number, y: number }[] | null) => void;
  saveRoute: (name: string, path: { x: number, y: number }[], metrics?: any) => Promise<void>;
}

export const useMapStore = create<MapState>((set, get) => ({
  facilityId: 'f1', // Default or from URL
  currentVersionId: null,
  mapVersions: [],
  zones: [],
  events: [],
  observations: [],
  actions: [],
  insights: [],
  nodes: [],
  edges: [],
  simulatedPath: null,
  savedRoutes: [],
  selectedId: null,
  selectedType: null,
  isLoading: false,
  error: null,
  isSnapEnabled: true,
  gridSize: 0.5,

  setFacilityId: (id) => set({ facilityId: id }),

  setCurrentVersion: (id) => {
    set({ currentVersionId: id });
    get().fetchData(id || undefined);
  },

  fetchVersions: async (facilityId) => {
    try {
      const res = await facilityApi.getVersions(facilityId);
      set({ mapVersions: res.data });
      if (!get().currentVersionId && res.data.length > 0) {
        const base = res.data.find((v: any) => v.isBaseVersion) || res.data[0];
        get().setCurrentVersion(base.id);
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchData: async (versionId) => {
    const vid = versionId || get().currentVersionId;
    if (!vid) return;

    set({ isLoading: true, error: null });
    try {
      const facilityId = get().facilityId || 'f1';
      const [zonesRes, eventsRes, networkRes, obsRes, actionsRes, insightsRes, routesRes] = await Promise.all([
        zoneApi.getAll({ versionId: vid }),
        eventApi.getAll({ facilityId }),
        networkApi.getNetwork(vid),
        observationApi.getAll({ facilityId }),
        actionApi.getAll(),
        engineeringApi.getDashboard(facilityId),
        routeApi.getAll({ facilityId, versionId: vid })
      ]);

      set({ 
        zones: zonesRes.data, 
        events: eventsRes.data, 
        nodes: networkRes.data.nodes,
        edges: networkRes.data.edges,
        observations: obsRes.data || [],
        actions: actionsRes.data || [],
        insights: insightsRes.data.insights || [],
        savedRoutes: routesRes.data || [],
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addNode: async (node) => {
    try {
      const res = await networkApi.createNode(node);
      set(state => ({ nodes: [...state.nodes, res.data] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  removeNode: async (id) => {
    try {
      await networkApi.deleteNode(id);
      set(state => ({ nodes: state.nodes.filter(n => n.id !== id) }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateNode: async (id, updates) => {
    try {
      const res = await networkApi.updateNode(id, updates);
      set(state => ({
        nodes: state.nodes.map(n => n.id === id ? { ...n, ...res.data } : n)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addEdge: async (edge) => {
    try {
      const res = await networkApi.createEdge(edge);
      set(state => ({ edges: [...state.edges, res.data] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  removeEdge: async (id) => {
    try {
      await networkApi.deleteEdge(id);
      set(state => ({ edges: state.edges.filter(e => e.id !== id) }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  setSelected: (id, type) => set({ selectedId: id, selectedType: type }),
  setSnapEnabled: (enabled) => set({ isSnapEnabled: enabled }),
  setGridSize: (size) => set({ gridSize: size }),
  setZones: (zones) => set({ zones }),
  addZone: async (zone) => {
    try {
      const res = await zoneApi.create(zone);
      set((state) => ({ zones: [...state.zones, res.data] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },
  removeZone: async (id) => {
    try {
      await zoneApi.delete(id);
      set((state) => ({ 
        zones: state.zones.filter(z => z.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        selectedType: state.selectedId === id ? null : state.selectedType
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },
  updateZone: async (id, updates) => {
    try {
      const res = await zoneApi.update(id, updates);
      set((state) => ({
        zones: state.zones.map(z => z.id === id ? res.data : z)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },
  setEvents: (events) => set({ events }),
  setSimulatedPath: (path) => set({ simulatedPath: path }),
  saveRoute: async (name, path, metrics) => {
    try {
      const res = await routeApi.save({
        name,
        path,
        metrics,
        facilityId: get().facilityId,
        versionId: get().currentVersionId
      });
      set((state) => ({ savedRoutes: [...state.savedRoutes, res.data] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
