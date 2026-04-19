import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const MapWorkspace = lazy(() => import('./pages/MapWorkspace').then(m => ({ default: m.MapWorkspace })));
const Heatmaps = lazy(() => import('./pages/Heatmaps').then(m => ({ default: m.Heatmaps })));
const RouteSimulation = lazy(() => import('./pages/RouteSimulation').then(m => ({ default: m.RouteSimulation })));
const RackElevation = lazy(() => import('./pages/RackElevation').then(m => ({ default: m.RackElevation })));
const LaborPlanning = lazy(() => import('./pages/LaborPlanning').then(m => ({ default: m.LaborPlanning })));
const Scenarios = lazy(() => import('./pages/Scenarios').then(m => ({ default: m.Scenarios })));
const CostModeling = lazy(() => import('./pages/CostModeling').then(m => ({ default: m.CostModeling })));
const Safety = lazy(() => import('./pages/Safety').then(m => ({ default: m.Safety })));
const MobileObservations = lazy(() => import('./pages/MobileObservations').then(m => ({ default: m.MobileObservations })));
const ActionTracker = lazy(() => import('./pages/ActionTracker').then(m => ({ default: m.ActionTracker })));
const Benchmarking = lazy(() => import('./pages/Benchmarking').then(m => ({ default: m.Benchmarking })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const CadIngestion = lazy(() => import('./pages/CadIngestion').then(m => ({ default: m.CadIngestion })));
const DataIngestion = lazy(() => import('./pages/DataIngestion'));
const EngineeringConsole = lazy(() => import('./pages/EngineeringConsole'));

const LoadingFallback = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#0f0f1b] text-white">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-[#7000ff] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-white/60 font-medium">Initializing Platform...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="map" element={<MapWorkspace />} />
                <Route path="heatmaps" element={<Heatmaps />} />
                <Route path="routes" element={<RouteSimulation />} />
                <Route path="racks" element={<RackElevation />} />
                <Route path="labor" element={<LaborPlanning />} />
                <Route path="scenarios" element={<Scenarios />} />
                <Route path="cost" element={<CostModeling />} />
                <Route path="safety" element={<Safety />} />
                <Route path="observations" element={<MobileObservations />} />
                <Route path="actions" element={<ActionTracker />} />
                <Route path="benchmarking" element={<Benchmarking />} />
                <Route path="engineering" element={<ProtectedRoute allowedRoles={['Admin', 'Engineer']}><EngineeringConsole /></ProtectedRoute>} />
                <Route path="admin" element={<ProtectedRoute allowedRoles={['Admin']}><Admin /></ProtectedRoute>} />
                <Route path="cad-ingestion" element={<ProtectedRoute allowedRoles={['Admin']}><CadIngestion /></ProtectedRoute>} />
                <Route path="ingestion" element={<ProtectedRoute allowedRoles={['Admin', 'Engineer']}><DataIngestion /></ProtectedRoute>} />
              </Route>

              <Route path="/unauthorized" element={
                <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0f0f1b] text-white p-4 text-center">
                  <h1 className="text-4xl font-bold mb-4">403 - Unauthorized</h1>
                  <p className="text-white/60 mb-8">You do not have permission to access this page.</p>
                  <button onClick={() => window.history.back()} className="px-6 py-2 bg-[#7000ff] rounded-lg font-bold">Go Back</button>
                </div>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
