import React, { useEffect } from 'react';
import { ShieldAlert, AlertOctagon, EyeOff, Loader2 } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';

export function Safety() {
  const { events, zones, isLoading, fetchData } = useMapStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#7000ff]" /></div>;
  }

  const nearMisses = events.filter(e => e.type === 'near_miss');
  const intersections = zones.filter(z => z.type === 'pedestrian').length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <ShieldAlert className="w-6 h-6 text-red-500 mr-2" />
            Safety Engineering Dashboard
          </h2>
          <p className="text-white/60 text-sm mt-1">Focused view on pedestrian interactions, near misses, and high-risk zones.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center text-red-400 mb-2">
            <AlertOctagon className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">High-Risk Crossings</h3>
          </div>
          <p className="text-3xl font-bold text-white">{intersections}</p>
          <p className="text-sm text-white/60 mt-1">Pedestrian zones defined</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center text-orange-400 mb-2">
            <ShieldAlert className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Near Miss Density</h3>
          </div>
          <p className="text-3xl font-bold text-white">{nearMisses.length}</p>
          <p className="text-sm text-white/60 mt-1">Reported across facility</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center text-white/80 mb-2">
            <EyeOff className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Events Logged</h3>
          </div>
          <p className="text-3xl font-bold text-white">{events.length}</p>
          <p className="text-sm text-white/60 mt-1">Total safety events captured</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Recent Incident Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-white/80">
            <thead className="text-xs text-white/60 uppercase bg-black/20">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Severity</th>
                <th className="px-6 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {events.filter(e => e.type === 'incident' || e.type === 'near_miss').slice(0, 10).map((event) => (
                <tr key={event.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">{new Date(event.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.type === 'near_miss' ? 'bg-orange-500/20 text-orange-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {event.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">{'x: ' + event.x.toFixed(1) + ', y: ' + event.y.toFixed(1)}</td>
                  <td className="px-6 py-4">{event.severity}/10</td>
                  <td className="px-6 py-4">{event.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
