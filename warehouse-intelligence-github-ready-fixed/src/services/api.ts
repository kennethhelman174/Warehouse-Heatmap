import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Broadcast session expiry event
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const facilityApi = {
  getAll: () => api.get('/facilities'),
  update: (id: string, data: any) => api.put(`/facilities/${id}`, data),
  getVersions: (id: string) => api.get(`/facilities/${id}/versions`),
};

export const networkApi = {
  getNetwork: (versionId?: string) => api.get('/map-network', { params: { versionId } }),
  createNode: (data: any) => api.post('/network/nodes', data),
  updateNode: (id: string, data: any) => api.put(`/network/nodes/${id}`, data),
  deleteNode: (id: string) => api.delete(`/network/nodes/${id}`),
  createEdge: (data: any) => api.post('/network/edges', data),
  deleteEdge: (id: string) => api.delete(`/network/edges/${id}`),
};

export const zoneApi = {
  getAll: (params?: any) => api.get('/zones', { params }),
  create: (data: any) => api.post('/zones', data),
  update: (id: string, data: any) => api.put(`/zones/${id}`, data),
  delete: (id: string) => api.delete(`/zones/${id}`),
};

export const eventApi = {
  getAll: (params?: any) => api.get('/events', { params }),
  create: (data: any) => api.post('/events', data),
};

export const dashboardApi = {
  getStats: (params?: any) => api.get('/stats', { params }),
};

export const rackApi = {
  getAll: (params?: any) => api.get('/racks', { params }),
  create: (data: any) => api.post('/racks', data),
  getStats: (id: string) => api.get(`/location-stats/${id}`),
};

export const observationApi = {
  getAll: (params?: any) => api.get('/observations', { params }),
  create: (data: any) => api.post('/observations', data),
};

export const routeApi = {
  getAll: (params?: any) => api.get('/saved-routes', { params }),
  save: (data: any) => api.post('/saved-routes', data),
};

export const actionApi = {
  getAll: () => api.get('/actions'),
  create: (data: any) => api.post('/actions', data),
  updateStatus: (id: string, status: string) => api.patch(`/actions/${id}`, { status }),
  verify: (id: string, data: { score: number, notes: string }) => api.post(`/engineering/actions/${id}/verify`, data),
};

export const engineeringApi = {
  getDashboard: (facilityId: string) => api.get('/engineering/dashboard', { params: { facilityId } }),
  analyze: (data: { facilityId: string, versionId: string, type: 'EHS' | 'IE' }) => api.post('/engineering/analyze', data),
};

export const cadApi = {
  upload: (formData: FormData) => api.post('/cad/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const importApi = {
  upload: (formData: FormData) => api.post('/import/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getJobs: () => api.get('/import/jobs'),
  getJobDetails: (id: string) => api.get(`/import/jobs/${id}`),
  commitJob: (id: string, data: { facilityId: string, versionId: string }) => 
    api.post(`/import/jobs/${id}/commit`, data),
};

export const simulationApi = {
  getScenarios: (params?: { facilityId: string }) => api.get('/scenarios', { params }),
  getScenarioRuns: (scenarioId: string) => api.get(`/scenarios/${scenarioId}/runs`),
};

export const laborApi = {
  getRecords: (params?: { facilityId: string }) => api.get('/labor/records', { params }),
  getPlans: (params?: { facilityId: string }) => api.get('/labor/plans', { params }),
};

export const financeApi = {
  getAssumptions: (params?: { facilityId: string }) => api.get('/finance/assumptions', { params }),
  getBenchmarks: (params?: { facilityId: string }) => api.get('/finance/benchmarks', { params }),
};
