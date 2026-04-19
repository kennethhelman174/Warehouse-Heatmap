import React, { useState, useEffect, useMemo } from 'react';
import { rackApi } from '../services/api';
import { Loader2, AlertCircle, Filter, Layers, Database, RefreshCw } from 'lucide-react';

interface RackLocation {
  id: string;
  rackId: string;
  aisle: string;
  row: string;
  bay: string;
  level: string;
  slot: string;
  locationCode: string;
  rackType: string;
  picks: number;
  incidents: number;
  occupancyStatus: string;
}

export function RackElevation() {
  const [racks, setRacks] = useState<RackLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<'none' | 'picks' | 'incidents'>('none');
  const [selectedRack, setSelectedRack] = useState<RackLocation | null>(null);
  const [aisleFilter, setAisleFilter] = useState('All');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await rackApi.getAll();
      setRacks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Rack Fetch Error:', err);
      setError('Unable to load rack data. The structural data might be missing or the service is temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRacks = useMemo(() => {
    return racks.filter(r => aisleFilter === 'All' || r.aisle === aisleFilter);
  }, [racks, aisleFilter]);

  // Group racks by aisle and bay
  const groupedRacks = useMemo(() => {
    return filteredRacks.reduce((acc: Record<string, Record<string, RackLocation[]>>, rack) => {
      const aisle = rack.aisle || 'Unknown';
      const bay = rack.bay || 'Unknown';
      if (!acc[aisle]) acc[aisle] = {};
      if (!acc[aisle][bay]) acc[aisle][bay] = [];
      acc[aisle][bay].push(rack);
      return acc;
    }, {});
  }, [filteredRacks]);

  const aisles = useMemo(() => Object.keys(groupedRacks).sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true })
  ), [groupedRacks]);

  const getHeatmapColor = (rack: RackLocation) => {
    if (heatmapMode === 'none') return 'bg-white/10';
    const value = heatmapMode === 'picks' ? rack.picks : rack.incidents;
    if (value > 50) return 'bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
    if (value > 20) return 'bg-orange-500/80 shadow-[0_0_10px_rgba(249,115,22,0.5)]';
    if (value > 0) return 'bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
    return 'bg-white/10';
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#7000ff]" />
        <p className="text-white/50 animate-pulse">Synchronizing inventory elevation maps...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div className="max-w-md glass-card p-8 border-red-500/30">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Data Synchronization Error</h3>
          <p className="text-white/60 mb-6">{error}</p>
          <button 
            onClick={fetchData}
            className="flex items-center justify-center space-x-2 w-full py-3 bg-[#7000ff] hover:bg-[#8a33ff] text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col bg-[#0a0a0b]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Rack Elevation Heatmap</h2>
          <p className="text-white/40 text-sm mt-1">Cross-section analysis of pick frequency & congestion hotspots</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <select 
              value={aisleFilter}
              onChange={(e) => setAisleFilter(e.target.value)}
              className="bg-black/40 border border-white/10 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:border-[#7000ff] focus:ring-1 focus:ring-[#7000ff] outline-none appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="All">All Aisles</option>
              {Array.from(new Set(racks.map(r => r.aisle || 'Unknown'))).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true })).map(a => (
                <option key={a} value={a}>Aisle {a}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <select 
              value={heatmapMode} 
              onChange={(e) => setHeatmapMode(e.target.value as any)}
              className="bg-black/40 border border-white/10 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:border-[#7000ff] focus:ring-1 focus:ring-[#7000ff] outline-none appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="none">No Heatmap</option>
              <option value="picks">Pick Frequency</option>
              <option value="incidents">Incident Density</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        <div className="flex-1 glass-card p-6 overflow-auto custom-scrollbar bg-black/20">
          {racks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
              <Database className="w-16 h-16 opacity-20" />
              <p className="text-lg">No rack locations found in database</p>
              <p className="text-sm">Run seed data or import CAD layout to populate</p>
            </div>
          ) : (
            aisles.map(aisle => (
              <div key={aisle} className="mb-12 last:mb-0">
                <div className="flex items-center gap-4 mb-6 sticky top-0 bg-[#0a0a0b]/80 backdrop-blur-sm py-2 z-10">
                  <h3 className="text-xl font-bold text-white">Aisle {aisle}</h3>
                  <div className="h-px flex-1 bg-white/10"></div>
                </div>
                {Object.keys(groupedRacks[aisle]).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(bay => (
                  <div key={bay} className="flex gap-6 mb-4 items-center group">
                    <div className="w-20 text-white/40 text-xs font-mono font-medium group-hover:text-white/60 transition-colors uppercase tracking-widest">Bay {bay}</div>
                    <div className="flex gap-2 flex-wrap">
                      {groupedRacks[aisle][bay].sort((a, b) => {
                        const levelA = parseInt(String(a.level)) || 0;
                        const levelB = parseInt(String(b.level)) || 0;
                        if (levelA !== levelB) return levelA - levelB;
                        return String(a.slot || '').localeCompare(String(b.slot || ''), undefined, { numeric: true });
                      }).map((rack) => (
                        <div 
                          key={rack.id}  
                          onClick={() => setSelectedRack(rack)}
                          className={`group/slot h-14 w-14 rounded-lg border border-white/10 flex flex-col items-center justify-center text-[10px] text-white/70 ${getHeatmapColor(rack)} transition-all duration-200 cursor-pointer hover:border-[#7000ff] hover:scale-110 active:scale-95 z-0 hover:z-10 ${selectedRack?.id === rack.id ? 'ring-2 ring-[#7000ff] border-[#7000ff] bg-[#7000ff]/20 z-10' : ''}`}
                        >
                          <span className="opacity-50 text-[8px] font-mono group-hover/slot:opacity-100 transition-opacity">L{rack.level}</span>
                          <span className="font-bold text-xs group-hover/slot:scale-110 transition-transform">{rack.slot}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {selectedRack && (
          <div className="w-80 glass-card p-6 flex flex-col bg-white/[0.03] border-l border-white/10 animate-in slide-in-from-right duration-300">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Location Intelligence</h3>
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-white/30 text-[10px] uppercase font-bold tracking-widest">Global Resource Identifier</span>
                <p className="text-white font-mono bg-white/5 p-2 rounded border border-white/5 text-xs">{selectedRack.locationCode}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-white/30 text-[10px] uppercase block mb-1">Aisle</span>
                  <span className="text-white font-medium">{selectedRack.aisle}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-white/30 text-[10px] uppercase block mb-1">Bay / Level</span>
                  <span className="text-white font-medium">{selectedRack.bay} / {selectedRack.level}</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Pick Velocity</span>
                  <span className={`text-sm font-bold ${selectedRack.picks > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedRack.picks} <span className="text-[10px] font-normal text-white/30">picks/mo</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Safety Incidents</span>
                  <span className={`text-sm font-bold ${selectedRack.incidents > 3 ? 'text-red-400' : 'text-white/70'}`}>
                    {selectedRack.incidents} <span className="text-[10px] font-normal text-white/30">recorded</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Inventory Status</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                    {selectedRack.occupancyStatus}
                  </span>
                </div>
              </div>
              
              <div className="pt-4">
                <div className="bg-[#7000ff]/10 border border-[#7000ff]/20 rounded-lg p-3">
                  <p className="text-[#a855f7] text-[10px] font-bold uppercase mb-1">Optimization Note</p>
                  <p className="text-white/60 text-[11px] leading-relaxed italic">
                    {selectedRack.picks > 40 
                      ? "High-velocity location. Recommend ergonomic assessment for frequent access." 
                      : "Low-velocity storage. Suitable for overstock or slow-moving items."}
                  </p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedRack(null)}
              className="mt-auto w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-all border border-white/10 hover:border-white/20 text-sm font-medium"
            >
              Dismiss Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
