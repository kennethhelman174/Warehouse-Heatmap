import React, { useState, useEffect } from 'react';
import { Shield, Activity, TrendingDown, CheckSquare, Clock, AlertTriangle, ArrowUpRight, Zap, ListChecks, Play, RefreshCw, BarChart3, Map as MapIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { useMapStore } from '../store/useMapStore';
import { EngineeringInsight, ActionItem } from '../types';
import { cn } from '../lib/utils';
import { engineeringApi, actionApi } from '../services/api';

export default function EngineeringConsole() {
  const { activeFacility } = useAppStore();
  const { currentVersionId } = useMapStore();
  const [insights, setInsights] = useState<EngineeringInsight[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [activeTab, setActiveTab] = useState<'EHS' | 'IE'>('EHS');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<EngineeringInsight | null>(null);
  const [reviewingAction, setReviewingAction] = useState<any | null>(null);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewNotes, setReviewNotes] = useState('');

  const submitReview = async () => {
    if (!reviewingAction) return;
    try {
      await actionApi.verify(reviewingAction.id, {
        score: reviewScore,
        notes: reviewNotes
      });
      setReviewingAction(null);
      await fetchData();
    } catch (err) {
      console.error('Verification error:', err);
    }
  };

  const fetchData = async () => {
    if (!activeFacility) return;
    try {
      const res = await engineeringApi.getDashboard(activeFacility.id);
      setInsights(res.data.insights || []);
      setActions(res.data.actions || []);
    } catch (err) {
      console.error('Error fetching engineering data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeFacility]);

  const runAnalysis = async (type: 'EHS' | 'IE') => {
    if (!activeFacility || !currentVersionId) return;
    setIsAnalyzing(true);
    try {
      await engineeringApi.analyze({
        facilityId: activeFacility.id,
        versionId: currentVersionId,
        type
      });
      await fetchData();
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredInsights = insights.filter(i => i.category === activeTab);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Engineering Console</h1>
          <p className="text-white/40 mt-1">Unified safety and industrial engineering analytics & workflow hub.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('EHS')}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'EHS' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-white/40 hover:text-white"
            )}
          >
            <Shield className="w-4 h-4" />
            <span>Safety Engineering</span>
          </button>
          <button 
            onClick={() => setActiveTab('IE')}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'IE' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-white/40 hover:text-white"
            )}
          >
            <Activity className="w-4 h-4" />
            <span>Industrial Engineering</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Metrics & Analysis Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 border-white/5 bg-white/2">
            <h3 className="text-xs font-bold text-white tracking-widest uppercase mb-4">Operations Status</h3>
            <div className="space-y-4">
              <StatusCard label="Active Hotspots" value={insights.filter(i => i.type === 'safety_hotspot').length} color="red" />
              <StatusCard label="Travel Gaps" value={insights.filter(i => i.type === 'travel_inefficiency').length} color="blue" />
              <StatusCard label="Pending Actions" value={actions.filter(a => a.status !== 'Completed').length} color="yellow" />
            </div>
            
            <hr className="my-6 border-white/10" />
            
            <button 
              onClick={() => runAnalysis(activeTab)}
              disabled={isAnalyzing}
              className={cn(
                "w-full py-4 rounded-xl flex items-center justify-center space-x-2 font-bold transition-all disabled:opacity-50",
                activeTab === 'EHS' ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
              )}
            >
              {isAnalyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              <span>Initiate {activeTab} Engine</span>
            </button>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xs font-bold text-white tracking-widest uppercase mb-4">Verification Loop</h3>
            <p className="text-xs text-white/40 mb-4">Close the loop on safety improvements by scoring effectiveness.</p>
              <div className="space-y-3">
                {actions.filter(a => a.status === 'Completed' && !a.verifiedAt).slice(0, 3).map(action => (
                  <div key={action.id} className="p-3 bg-white/5 rounded-lg border border-white/10 group cursor-pointer hover:border-white/20 transition-all">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">READY</span>
                    </div>
                    <h4 className="text-sm text-white mt-1 font-medium">{action.title}</h4>
                    <button 
                      onClick={() => setReviewingAction(action)}
                      className="mt-2 w-full py-2 bg-[#7000ff]/20 text-[10px] font-bold text-[#b780ff] hover:text-white hover:bg-[#7000ff] rounded transition-all"
                    >
                      RUN EFFECTIVENESS REVIEW
                    </button>
                  </div>
                ))}
                {actions.filter(a => a.status === 'Completed' && !a.verifiedAt).length === 0 && (
                 <div className="text-center py-4 text-white/20">
                   <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-50" />
                   <p className="text-xs">All actions verified</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Center Column: Insights List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'EHS' ? 'Safety Risk Analytics' : 'Travel Efficiency Insights'}
            </h2>
            <div className="flex space-x-2">
              <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-all"><BarChart3 className="w-4 h-4" /></button>
              <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-all"><MapIcon className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInsights.map(insight => (
              <motion.div 
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedInsight(insight)}
                className={cn(
                  "p-6 glass-card border-white/5 hover:border-white/20 cursor-pointer group transition-all relative overflow-hidden",
                  selectedInsight?.id === insight.id && "ring-2 ring-opacity-50",
                  insight.category === 'EHS' ? "hover:bg-red-500/5 ring-red-500" : "hover:bg-blue-500/5 ring-blue-500"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "p-2 rounded-lg border",
                    insight.category === 'EHS' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                  )}>
                    {insight.type === 'safety_hotspot' ? <AlertTriangle className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{insight.id.split('-')[0]}</span>
                    <span className={cn(
                      "mt-1 text-xs font-bold",
                      insight.severity > 3 ? "text-red-400" : "text-yellow-400"
                    )}>
                      {insight.severity === 5 ? 'CRITICAL' : insight.severity > 3 ? 'HIGH' : 'MEDIUM'} RISK
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  {insight.type === 'safety_hotspot' ? `Interaction Cluster: ${insight.details.zoneName}` : `Efficiency Gap: Operator ${insight.details.operatorId}`}
                </h3>
                
                <p className="text-sm text-white/50 mb-4 line-clamp-2">
                  {insight.type === 'safety_hotspot' 
                    ? `Identified ${insight.details.eventCount} interactions requiring engineering intervention.` 
                    : `Pick efficiency dropped to ${insight.details.efficiency} over the last shift period.`}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex space-x-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Score</span>
                      <span className="text-sm font-mono text-white">{insight.score.toFixed(1)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Trend</span>
                      <span className="text-sm font-mono text-white flex items-center">
                        <ArrowUpRight className="w-3 h-3 mr-1 text-red-400" />
                        +12%
                      </span>
                    </div>
                  </div>
                  <button className="flex items-center text-xs font-bold text-white-40 hover:text-white transition-all">
                    Link Workflow <ArrowUpRight className="w-4 h-4 ml-1" />
                  </button>
                </div>

                {/* Background Decor */}
                <div className={cn(
                  "absolute -right-4 -bottom-4 w-24 h-24 opacity-5 blur-2xl rounded-full",
                  insight.category === 'EHS' ? "bg-red-500" : "bg-blue-500"
                )} />
              </motion.div>
            ))}

            {filteredInsights.length === 0 && (
              <div className="col-span-2 h-64 flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
                <Zap className="w-12 h-12 mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-white/40">No insights detected. Run the analysis engine to generate results.</h3>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {reviewingAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#1a1a2a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-white uppercase tracking-wider">Effectiveness Review</h3>
                <button onClick={() => setReviewingAction(null)}><X className="w-5 h-5 text-white/40" /></button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-4">
                    Observed Improvement Score: {reviewScore}/10
                  </label>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={reviewScore}
                    onChange={(e) => setReviewScore(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7000ff]"
                  />
                  <div className="flex justify-between text-[10px] text-white/20 font-bold mt-2">
                    <span>NO IMPACT</span>
                    <span>NEUTRAL</span>
                    <span>ELIMINATED RISK</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Observations & Results</label>
                  <textarea 
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Describe the physical results of this action (e.g., 'Blind corner mirrors installed, zero near-misses recorded in 24 hours')..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white h-32 outline-none focus:border-[#7000ff] transition-all"
                  />
                </div>

                <div className="flex space-x-3">
                  <button 
                    onClick={() => setReviewingAction(null)}
                    className="flex-1 py-3 border border-white/10 text-white/60 font-bold rounded-xl hover:bg-white/5 transition-all"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={submitReview}
                    className="flex-[2] py-3 bg-[#7000ff] text-white font-bold rounded-xl hover:bg-[#5a00cc] transition-all shadow-lg active:scale-95"
                  >
                    COMPLETE REVIEW
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusCard({ label, value, color }: { label: string, value: number, color: 'red' | 'blue' | 'yellow' }) {
  const styles = {
    red: "text-red-400 border-red-500/20 bg-red-500/5",
    blue: "text-blue-400 border-blue-500/20 bg-blue-500/5",
    yellow: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5",
  };

  return (
    <div className={cn("p-4 rounded-2xl border flex flex-col", styles[color])}>
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{label}</span>
      <span className="text-2xl font-bold font-mono text-white">{value}</span>
    </div>
  );
}
