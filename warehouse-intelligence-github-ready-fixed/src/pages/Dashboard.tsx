import React, { useState, useEffect } from 'react';
import { useMapStore } from '../store/useMapStore';
import { AlertTriangle, Activity, Route, ShieldAlert, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { dashboardApi, engineeringApi } from '../services/api';
import { DashboardStats } from '../types/dashboard';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';

const trendData = [
  { name: 'Mon', incidents: 2, nearMisses: 5, congestion: 12 },
  { name: 'Tue', incidents: 0, nearMisses: 3, congestion: 15 },
  { name: 'Wed', incidents: 1, nearMisses: 8, congestion: 10 },
  { name: 'Thu', incidents: 0, nearMisses: 2, congestion: 8 },
  { name: 'Fri', incidents: 3, nearMisses: 6, congestion: 18 },
];

export function Dashboard() {
  const { activeFacility } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const facilityId = activeFacility?.id || 'f1';
        const [statsRes, insightsRes] = await Promise.all([
          dashboardApi.getStats({ facilityId }),
          engineeringApi.getDashboard(facilityId).catch(() => ({ data: { insights: [] } }))
        ]);
        setStats(statsRes.data as DashboardStats);
        setInsights(insightsRes.data?.insights || []);
        setLastUpdated(new Date());
      } catch (err: any) {
        console.error('Dashboard data load failed', err);
        setError('Connection to warehouse neural engine interrupted. Please verify system status.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [activeFacility]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7000ff]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400 p-6 text-center">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-bold mb-2">Dashboard Error</h3>
        <p className="max-w-md mb-6">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Executive Overview</h2>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-xs text-white/60">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
          <select className="bg-black/20 border border-white/20 text-white text-sm rounded-md focus:ring-[#7000ff] focus:border-[#7000ff] block p-2">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Quarter</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/60">Near Misses</p>
              <p className="text-3xl font-bold text-white mt-2">{stats?.nearMisses || 0}</p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-400 font-medium">{stats?.nearMisses} logged</span>
            <span className="text-white/60 ml-2">requires attention</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/60">Actual Incidents</p>
              <p className="text-3xl font-bold text-white mt-2">{stats?.incidents || 0}</p>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-white/60">recorded in system</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/60">Defined Zones</p>
              <p className="text-3xl font-bold text-white mt-2">{stats?.totalZones || 0}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Route className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-white/60">mapped areas</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/60">Open Action Items</p>
              <p className="text-3xl font-bold text-white mt-2">{stats?.openActions || 0}</p>
            </div>
            <div className="p-3 bg-[#7000ff]/20 rounded-lg">
              <Activity className="w-6 h-6 text-[#7000ff]" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-orange-400 font-medium">pending resolution</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Safety Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.6)'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.6)'}} />
                <Tooltip contentStyle={{backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff'}} itemStyle={{color: '#fff'}} />
                <Line type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} />
                <Line type="monotone" dataKey="nearMisses" stroke="#f97316" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Congestion by Day</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.6)'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.6)'}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff'}} itemStyle={{color: '#fff'}} />
                <Bar dataKey="congestion" fill="#7000ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Opportunities */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Engineering Opportunities</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-white/60">
            <thead className="text-xs text-white/60 uppercase border-b border-white/10">
              <tr>
                <th scope="col" className="px-6 py-3">Source / Location</th>
                <th scope="col" className="px-6 py-3">Type</th>
                <th scope="col" className="px-6 py-3">Risk/Score</th>
                <th scope="col" className="px-6 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {insights.length > 0 ? (
                insights.slice(0, 5).map(insight => {
                  const details = insight.details || {};
                  return (
                    <tr key={insight.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{details.zoneName || details.operatorId || 'System Detected'}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          insight.category === 'EHS' ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                        )}>
                          {insight.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono">{insight.score?.toFixed(1)}</td>
                      <td className="px-6 py-4 text-xs italic">{details.description || details.riskType || 'No additional details'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-white/20 italic">
                    Run the Engineering Analysis Engine to identify opportunities.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
