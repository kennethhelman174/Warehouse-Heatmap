import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Circle, Group } from 'react-konva';
import { useMapStore } from '../store/useMapStore';
import { useAppStore } from '../store/useAppStore';
import { 
  Play, Settings2, Route as RouteIcon, AlertTriangle, ShieldCheck, 
  Zap, Scale, Clock, Ruler, AlertCircle, TrendingUp, TrendingDown,
  Layers, Info, CheckCircle2, Save, ArrowRight
} from 'lucide-react';
import { findPath, getDistance, RoutingMode, AdvancedRouteResult } from '../lib/pathfinding';
import { networkApi, zoneApi } from '../services/api';

export function RouteSimulation() {
  const { activeFacility } = useAppStore();
  const { 
    zones, nodes, edges, events, mapVersions, currentVersionId,
    fetchData, setSimulatedPath, saveRoute 
  } = useMapStore();
  
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [equipment, setEquipment] = useState<'forklift' | 'pedestrian'>('forklift');
  const [activityType, setActivityType] = useState('picking');
  const [mode, setMode] = useState<RoutingMode>('balanced');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<AdvancedRouteResult | null>(null);
  
  // Comparison State
  const [compareVersionId, setCompareVersionId] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<AdvancedRouteResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  
  const [routeName, setRouteName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (nodes.length > 0 && !startPoint) {
      setStartPoint(nodes[0].id);
      setEndPoint(nodes[nodes.length - 1].id);
    }
  }, [nodes]);

  const scale = 8;

  const handleSimulate = async () => {
    setIsSimulating(true);
    
    if (!startPoint || !endPoint) {
      setIsSimulating(false);
      return;
    }

    // Run primary simulation
    const result = findPath(
      startPoint, 
      endPoint, 
      nodes, 
      edges, 
      zones,
      events, 
      mode, 
      equipment,
      activityType
    );

    setSimulationResult(result);
    setSimulatedPath(result.path);

    // Run comparison if enabled
    if (compareVersionId && compareVersionId !== currentVersionId) {
      setIsComparing(true);
      try {
        const [netRes, zoneRes] = await Promise.all([
          networkApi.getNetwork(compareVersionId),
          zoneApi.getAll({ versionId: compareVersionId })
        ]);
        
        const compResult = findPath(
          startPoint, 
          endPoint, 
          netRes.data.nodes, 
          netRes.data.edges, 
          zoneRes.data,
          events, 
          mode, 
          equipment,
          activityType
        );
        setComparisonResult(compResult);
      } catch (err) {
        console.error("Comparison simulation failed", err);
      } finally {
        setIsComparing(false);
      }
    } else {
      setComparisonResult(null);
    }

    setIsSimulating(false);
  };

  const handleSaveRoute = () => {
    if (simulationResult && routeName) {
      saveRoute(routeName, simulationResult.path);
      setRouteName('');
    }
  };

  const getDelta = (val1: number, val2: number) => {
    const diff = val1 - val2;
    const percent = Math.abs(Math.round((diff / val2) * 100));
    return { diff, percent, better: diff < 0 };
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b border-white/10 shrink-0 bg-black/40 backdrop-blur-md">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <RouteIcon className="w-6 h-6 text-[#00d4ff] mr-2" />
              Route Intelligence Studio
            </h2>
            <p className="text-white/60 text-sm mt-1">Industrial Engineering grade path analysis with multi-factor risk weighting.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest bg-white/5 py-1 px-2 rounded">A* Engine v2.4</span>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <button className="text-white/40 hover:text-white">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Controls */}
        <div className="w-85 border-r border-white/10 flex flex-col shrink-0 overflow-y-auto bg-[#0a0a0f]">
          <div className="p-5 space-y-6">
            <section>
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center">
                <Settings2 className="w-3.5 h-3.5 mr-2" />
                Scenario Parameters
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-white/30 uppercase mb-1">Origin Node</label>
                    <select 
                      value={startPoint}
                      onChange={e => setStartPoint(e.target.value)}
                      className="w-full bg-white/5 border-white/10 text-white rounded-md p-2 text-xs focus:ring-[#7000ff] focus:border-[#7000ff]"
                    >
                      {nodes.map(n => <option key={n.id} value={n.id} className="bg-[#1a1a2e]">{n.id} ({n.type})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/30 uppercase mb-1">Destination Node</label>
                    <select 
                      value={endPoint}
                      onChange={e => setEndPoint(e.target.value)}
                      className="w-full bg-white/5 border-white/10 text-white rounded-md p-2 text-xs focus:ring-[#7000ff] focus:border-[#7000ff]"
                    >
                      {nodes.map(n => <option key={n.id} value={n.id} className="bg-[#1a1a2e]">{n.id} ({n.type})</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase mb-1">Equipment Configuration</label>
                  <select 
                    value={equipment}
                    onChange={e => setEquipment(e.target.value as any)}
                    className="w-full bg-white/5 border-white/10 text-white rounded-md p-2 text-xs focus:ring-[#7000ff] focus:border-[#7000ff]"
                  >
                    <option value="forklift" className="bg-[#1a1a2e]">Heavy Forklift / Reach Truck</option>
                    <option value="pedestrian" className="bg-[#1a1a2e]">Pedestrian / Walkie-Rider</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase mb-1">Operational Activity-Class</label>
                  <select 
                    value={activityType}
                    onChange={e => setActivityType(e.target.value)}
                    className="w-full bg-white/5 border-white/10 text-white rounded-md p-2 text-xs focus:ring-[#7000ff] focus:border-[#7000ff]"
                  >
                    <option value="receiving" className="bg-[#1a1a2e]">Inbound Receiving</option>
                    <option value="putaway" className="bg-[#1a1a2e]">Bulk Putaway</option>
                    <option value="replenishment" className="bg-[#1a1a2e]">Active Replenishment</option>
                    <option value="picking" className="bg-[#1a1a2e]">E-Comm Picking</option>
                    <option value="shipping" className="bg-[#1a1a2e]">Outbound Shipping</option>
                    <option value="battery_change" className="bg-[#1a1a2e]">PM / Battery Change</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-white/30 uppercase mb-2">Cost Optimization Goal</label>
                  <div className="grid grid-cols-3 gap-2 bg-black/40 p-1.5 rounded-lg border border-white/5">
                    {[
                      { id: 'shortest', icon: Zap, label: 'Distance' },
                      { id: 'balanced', icon: Scale, label: 'Balanced' },
                      { id: 'safest', icon: ShieldCheck, label: 'Risk' }
                    ].map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setMode(item.id as RoutingMode)}
                        className={`flex flex-col items-center justify-center py-2.5 rounded transition-all ${mode === item.id ? 'bg-[#7000ff] text-white shadow-lg shadow-[#7000ff]/20' : 'text-white/30 hover:bg-white/5 hover:text-white/60'}`}
                      >
                        <item.icon className="w-4 h-4 mb-1" />
                        <span className="text-[9px] font-bold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase">Compare Versions</label>
                    <div className="flex items-center text-[10px] text-[#00d4ff] font-bold">
                      <Layers className="w-3 h-3 mr-1" /> Compare On
                    </div>
                  </div>
                  <select 
                    value={compareVersionId}
                    onChange={e => setCompareVersionId(e.target.value)}
                    className="w-full bg-white/5 border-white/10 text-white rounded-md p-2 text-xs focus:ring-[#00d4ff] focus:border-[#00d4ff]"
                  >
                    <option value="" className="bg-[#1a1a2e]">No Comparison</option>
                    {mapVersions.filter(v => v.id !== currentVersionId).map(v => (
                      <option key={v.id} value={v.id} className="bg-[#1a1a2e]">{v.name} ({v.status})</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={handleSimulate}
                disabled={isSimulating}
                className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-xl text-sm font-bold text-white bg-gradient-to-r from-[#7000ff] to-[#00d4ff] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
              >
                {isSimulating ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                    Calculating A* Path...
                  </div>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Analyze Routing
                  </>
                )}
              </button>
            </div>

            {simulationResult && (
              <div className="pt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Route Metrics</h3>
                    <div className="flex space-x-1">
                      {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-500/50" />)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard 
                      icon={Ruler} 
                      label="Distance" 
                      value={`${simulationResult.distance}ft`} 
                      comparison={comparisonResult ? getDelta(simulationResult.distance, comparisonResult.distance) : null}
                    />
                    <MetricCard 
                      icon={Clock} 
                      label="Est. Time" 
                      value={`${simulationResult.totalTime}s`} 
                      comparison={comparisonResult ? getDelta(simulationResult.totalTime, comparisonResult.totalTime) : null}
                    />
                    <MetricCard 
                      icon={ShieldCheck} 
                      label="Risk Index" 
                      value={simulationResult.riskScore} 
                      comparison={comparisonResult ? getDelta(simulationResult.riskScore, comparisonResult.riskScore) : null}
                      unit="/ 100"
                    />
                    <MetricCard 
                      icon={AlertCircle} 
                      label="Conflicts" 
                      value={simulationResult.conflictCount} 
                      comparison={comparisonResult ? getDelta(simulationResult.conflictCount, comparisonResult.conflictCount) : null}
                    />
                  </div>
                </div>

                {simulationResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1.5 text-orange-400" />
                      Engineering Warnings
                    </div>
                    {simulationResult.warnings.map((w: string, i: number) => (
                      <div key={i} className="flex items-center bg-orange-500/5 p-2 rounded-md border border-orange-500/10">
                        <span className="text-[10px] text-orange-200/70 font-medium leading-tight">{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Activity Efficiency</div>
                    <div className="text-[10px] font-bold text-white">{(simulationResult.activityEfficiency * 100).toFixed(0)}%</div>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-1000"
                      style={{ width: `${simulationResult.activityEfficiency * 100}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-white/30 mt-2 leading-relaxed">
                    Score based on path tortuosity, congestion factor, and required safety slowed-down nodes.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="Name this study..." 
                      value={routeName} 
                      onChange={e => setRouteName(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 text-xs focus:ring-[#7000ff] focus:border-[#7000ff]"
                    />
                    <button 
                      onClick={handleSaveRoute}
                      disabled={!routeName}
                      className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-md transition-colors disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 p-6 relative bg-[#050508] flex items-center justify-center">
          <div className="absolute top-6 left-6 z-10 space-y-2">
            <div className="glass-card !bg-black/60 p-3 rounded-xl border border-white/10 pointer-events-none">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Origin</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Target</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-0.5 bg-[#00d4ff] mr-2 shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Active Route</span>
                </div>
              </div>
            </div>
            {isComparing && (
              <div className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 px-4 py-2 rounded-full text-xs font-bold animate-pulse inline-flex items-center">
                <Layers className="w-3 h-3 mr-2" />
                Processing Future Scenario Graph...
              </div>
            )}
          </div>

          <div className="glass-card overflow-hidden !rounded-[40px] border-[12px] border-black/50 shadow-2xl relative">
            {activeFacility && (
              <Stage width={activeFacility.width * scale} height={activeFacility.height * scale}>
                <Layer>
                  {/* Base Map */}
                  <Rect x={0} y={0} width={activeFacility.width * scale} height={activeFacility.height * scale} fill="#0a0a0f" />
                  
                  {/* Engineering Grid */}
                  {[...Array(Math.floor(activeFacility.width))].map((_, i) => (
                    <Line key={`v-${i}`} points={[i * scale, 0, i * scale, activeFacility.height * scale]} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
                  ))}
                  {[...Array(Math.floor(activeFacility.height))].map((_, i) => (
                    <Line key={`h-${i}`} points={[0, i * scale, activeFacility.width * scale, i * scale]} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
                  ))}

                  {zones.map(zone => (
                    <Rect
                      key={zone.id}
                      x={zone.x * scale}
                      y={zone.y * scale}
                      width={zone.width * scale}
                      height={zone.height * scale}
                      fill={getZoneColor(zone.type)}
                      opacity={0.15}
                      stroke={getZoneColor(zone.type)}
                      strokeWidth={1}
                    />
                  ))}

                  {/* Network Edges */}
                  {edges.map((edge) => {
                    const fromNode = nodes.find(n => n.id === edge.from);
                    const toNode = nodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;
                    return (
                      <Line
                        key={edge.id}
                        points={[fromNode.x * scale, fromNode.y * scale, toNode.x * scale, toNode.y * scale]}
                        stroke={edge.type === 'pedestrian' ? '#86efac' : 'rgba(255,255,255,0.08)'}
                        strokeWidth={1.5}
                        dash={edge.isOneWay ? [5, 5] : undefined}
                      />
                    );
                  })}
                  
                  {/* Network Nodes */}
                  {nodes.map(node => (
                    <Circle
                      key={node.id}
                      x={node.x * scale}
                      y={node.y * scale}
                      radius={2}
                      fill={node.type === 'intersection' ? '#fde047' : 'rgba(255,255,255,0.1)'}
                    />
                  ))}

                  {/* Simulated Path Overlay */}
                  {simulationResult && (
                    <>
                      {/* Glow Effect */}
                      <Line
                        points={simulationResult.path.flatMap((p: any) => [p.x * scale, p.y * scale])}
                        stroke="#00d4ff"
                        strokeWidth={8}
                        opacity={0.1}
                        lineJoin="round"
                        lineCap="round"
                      />
                      <Line
                        points={simulationResult.path.flatMap((p: any) => [p.x * scale, p.y * scale])}
                        stroke="#00d4ff"
                        strokeWidth={3}
                        lineJoin="round"
                        lineCap="round"
                        dash={[8, 4]}
                      />
                      
                      {/* Start/End Indicators */}
                      {simulationResult.path.length > 0 && (
                        <Group>
                          <Circle 
                            x={simulationResult.path[0].x * scale} 
                            y={simulationResult.path[0].y * scale} 
                            radius={6} 
                            fill="#22c55e" 
                            stroke="rgba(34,197,94,0.3)"
                            strokeWidth={8}
                          />
                          <Circle 
                            x={simulationResult.path[simulationResult.path.length-1].x * scale} 
                            y={simulationResult.path[simulationResult.path.length-1].y * scale} 
                            radius={6} 
                            fill="#ef4444" 
                            stroke="rgba(239,68,68,0.3)"
                            strokeWidth={8}
                          />
                        </Group>
                      )}
                    </>
                  )}
                </Layer>
              </Stage>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, comparison, unit = '' }: any) {
  return (
    <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5 relative overflow-hidden group hover:border-[#7000ff]/30 transition-all">
      <div className="flex items-center text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">
        <Icon className="w-3 h-3 mr-1.5" /> {label}
      </div>
      <div className="flex items-baseline space-x-1">
        <span className="text-lg font-black text-white">{value}</span>
        {unit && <span className="text-[10px] text-white/30 font-bold">{unit}</span>}
      </div>
      
      {comparison && (
        <div className={`mt-2 flex items-center text-[10px] font-bold ${comparison.better ? 'text-green-400' : 'text-orange-400'}`}>
          {comparison.better ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
          {comparison.percent}% {comparison.diff > 0 ? 'higher' : 'lower'}
        </div>
      )}
      
      <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <CheckCircle2 className="w-3 h-3 text-[#7000ff]/50" />
      </div>
    </div>
  );
}

function getZoneColor(type: string) {
  switch (type) {
    case 'dock': return '#3b82f6';
    case 'staging': return '#8b5cf6';
    case 'aisle': return '#94a3b8';
    case 'restricted': return '#ef4444';
    case 'blind_corner': return '#f59e0b';
    case 'pedestrian': return '#10b981';
    default: return '#64748b';
  }
}
