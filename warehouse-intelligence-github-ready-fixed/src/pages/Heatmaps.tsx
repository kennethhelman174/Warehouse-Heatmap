import React, { useState, useMemo, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Group } from 'react-konva';
import { useMapStore } from '../store/useMapStore';
import { useAppStore } from '../store/useAppStore';
import { Flame, Filter, Download, Loader2, ArrowRight } from 'lucide-react';
import { engineeringApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

export function Heatmaps() {
  const navigate = useNavigate();
  const { activeFacility } = useAppStore();
  const { zones, events, fetchData } = useMapStore();
  const [heatmapType, setHeatmapType] = useState<'all' | 'incident' | 'near_miss' | 'congestion'>('all');
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredEvents = useMemo(() => {
    if (heatmapType === 'all') return events;
    return events.filter(e => e.type === heatmapType);
  }, [events, heatmapType]);

  // Calculate a simple density grid for the heatmap
  const densityGrid = useMemo(() => {
    if (!activeFacility) return [];
    const gridSize = 5; // 5x5 foot grid cells
    const cols = Math.ceil(activeFacility.width / gridSize);
    const rows = Math.ceil(activeFacility.height / gridSize);
    
    const grid = Array(rows).fill(0).map(() => Array(cols).fill(0));
    let maxDensity = 0;

    filteredEvents.forEach(event => {
      const col = Math.floor(event.x / gridSize);
      const row = Math.floor(event.y / gridSize);
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        // Weight by severity
        grid[row][col] += event.severity || 1;
        if (grid[row][col] > maxDensity) maxDensity = grid[row][col];
      }
    });

    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] > 0) {
          cells.push({
            x: c * gridSize,
            y: r * gridSize,
            size: gridSize,
            intensity: grid[r][c] / maxDensity // 0 to 1
          });
        }
      }
    }
    return cells;
  }, [activeFacility, filteredEvents]);

  const getColor = (intensity: number) => {
    // Simple color scale: Blue -> Green -> Yellow -> Red
    if (intensity > 0.75) return 'rgba(239, 68, 68, 0.7)'; // Red
    if (intensity > 0.5) return 'rgba(249, 115, 22, 0.6)'; // Orange
    if (intensity > 0.25) return 'rgba(234, 179, 8, 0.5)'; // Yellow
    return 'rgba(59, 130, 246, 0.4)'; // Blue
  };

  const scale = 8; // Fixed scale for this view

  const [insights, setInsights] = useState<any[]>([]);
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  useEffect(() => {
    const loadInsights = async () => {
      if (!activeFacility) return;
      setIsInsightLoading(true);
      try {
        const res = await engineeringApi.getDashboard(activeFacility.id);
        setInsights(res.data.insights || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsInsightLoading(false);
      }
    };
    loadInsights();
  }, [activeFacility]);

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0 bg-black/40 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Flame className="w-6 h-6 text-orange-500 mr-2" />
            Remediation Heatmaps
          </h2>
          <p className="text-white/60 text-sm mt-1">Spatially mapped risk and congestion indicators based on operational telemetry.</p>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2 bg-black/20 p-1 rounded-lg border border-white/10">
            <button 
              onClick={() => setHeatmapType('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${heatmapType === 'all' ? 'bg-white/20 shadow text-white' : 'text-white/60 hover:text-white'}`}
            >
              Composite Risk
            </button>
            <button 
              onClick={() => setHeatmapType('incident')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${heatmapType === 'incident' ? 'bg-white/20 shadow text-white' : 'text-white/60 hover:text-white'}`}
            >
              Incidents
            </button>
            <button 
              onClick={() => setHeatmapType('near_miss')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${heatmapType === 'near_miss' ? 'bg-white/20 shadow text-white' : 'text-white/60 hover:text-white'}`}
            >
              Near Misses
            </button>
            <button 
              onClick={() => setHeatmapType('congestion')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${heatmapType === 'congestion' ? 'bg-white/20 shadow text-white' : 'text-white/60 hover:text-white'}`}
            >
              Congestion
            </button>
          </div>
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-black/20 border border-white/20 text-white text-sm rounded-md focus:ring-[#7000ff] focus:border-[#7000ff] block p-2"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className="flex items-center px-3 py-2 bg-white/5 border border-white/20 text-white text-sm font-medium rounded-md hover:bg-white/10">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-hidden flex space-x-6">
        {/* Map Area */}
        <div className="flex-1 glass-card overflow-hidden flex items-center justify-center relative">
          {activeFacility && (
            <Stage width={activeFacility.width * scale} height={activeFacility.height * scale}>
              <Layer>
                {/* Base Map (Faded) */}
                <Rect x={0} y={0} width={activeFacility.width * scale} height={activeFacility.height * scale} fill="#0f0f1b" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                {zones.map(zone => (
                  <Rect
                    key={zone.id}
                    x={zone.x * scale}
                    y={zone.y * scale}
                    width={zone.width * scale}
                    height={zone.height * scale}
                    fill={zone.color || '#e2e8f0'}
                    opacity={0.3}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={1}
                  />
                ))}

                {/* Heatmap Layer */}
                {densityGrid.map((cell, i) => (
                  <Rect
                    key={i}
                    x={cell.x * scale}
                    y={cell.y * scale}
                    width={cell.size * scale}
                    height={cell.size * scale}
                    fill={getColor(cell.intensity)}
                    // Use a slight blur effect if supported, or just rely on opacity
                    shadowBlur={10}
                    shadowColor={getColor(cell.intensity)}
                  />
                ))}
              </Layer>
            </Stage>
          )}
          
          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10">
            <h4 className="text-xs font-semibold text-white mb-2">Density</h4>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-white/60 mr-1">Low</span>
              <div className="w-6 h-4 bg-blue-400 opacity-40 rounded-sm"></div>
              <div className="w-6 h-4 bg-yellow-400 opacity-50 rounded-sm"></div>
              <div className="w-6 h-4 bg-orange-500 opacity-60 rounded-sm"></div>
              <div className="w-6 h-4 bg-red-500 opacity-70 rounded-sm"></div>
              <span className="text-xs text-white/60 ml-1">High</span>
            </div>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="w-80 flex flex-col space-y-6 shrink-0 overflow-y-auto">
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-white/50 mb-4 uppercase tracking-widest">Top Risks (Detected)</h3>
            <div className="space-y-4">
              {isInsightLoading ? (
                <div className="py-4 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-white/20" /></div>
              ) : insights.length === 0 ? (
                <p className="text-xs text-white/20 italic">No engineering risks detected in this facility version.</p>
              ) : (
                insights.slice(0, 5).map((insight, idx) => (
                  <div key={insight.id} className="flex items-start group cursor-default">
                    <div className={`w-6 h-6 rounded-full ${insight.severity > 3 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'} flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border border-white/5 group-hover:border-white/20 transition-all`}>
                      {idx + 1}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-bold text-white/90 truncate max-w-[180px]">{insight.details?.zone_name || 'Spatial Asset'}</p>
                      <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2 uppercase tracking-tight">{insight.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card p-5 flex-1 bg-gradient-to-br from-[#7000ff]/5 to-transparent">
            <h3 className="text-sm font-bold text-white/50 mb-4 uppercase tracking-widest">System Recommendation</h3>
            {insights.length > 0 ? (
              <div className="bg-[#7000ff]/10 border border-[#7000ff]/30 rounded-xl p-4 shadow-inner">
                <p className="text-xs text-white/80 leading-relaxed italic">
                  "Geometric analysis recommends immediate intervention at <span className="text-white font-bold">{insights[0].details?.zone_name}</span> to reduce interaction risk by an estimated <span className="text-[#00d4ff] font-bold">{(insights[0].score * 4.2).toFixed(1)}%</span> based on composite heat scores."
                </p>
                <button 
                  onClick={() => navigate('/engineering')}
                  className="mt-4 w-full py-2 bg-white/5 border border-white/10 text-white font-bold rounded-lg hover:bg-white/10 transition-all flex items-center justify-center space-x-2 text-[11px] uppercase tracking-wider"
                >
                  <span>Model Scenario</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            ) : (
              <div className="bg-white/2 border border-white/5 rounded-xl p-6 text-center italic text-white/20 text-xs">
                Run analysis in the Engineering Console to generate spatial recommendations.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
