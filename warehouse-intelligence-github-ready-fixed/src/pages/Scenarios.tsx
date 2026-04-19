import React, { useEffect, useState } from 'react';
import { GitCompare, Plus, ArrowRight, CheckCircle2, Loader2, Info } from 'lucide-react';
import { simulationApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export function Scenarios() {
  const { activeFacility } = useAppStore();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadScenarios() {
      if (!activeFacility) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await simulationApi.getScenarios({ facilityId: activeFacility.id });
        setScenarios(res.data);
      } catch (err: any) {
        setError('Failed to load scenario data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadScenarios();
  }, [activeFacility]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/60">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#7000ff]" />
        <p>Syncing simulation models...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <GitCompare className="w-6 h-6 text-[#7000ff] mr-2" />
            Scenario Modeling
          </h2>
          <p className="text-white/60 text-sm mt-1">Compare baseline layouts against proposed changes to quantify impact.</p>
        </div>
        <button 
          disabled
          className="flex items-center px-4 py-2 bg-[#7000ff]/50 text-white/50 text-sm font-medium rounded-md cursor-not-allowed border border-[#7000ff]/20"
          title="New scenario creation coming soon"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Scenario
        </button>
      </div>

      {error ? (
        <div className="glass-card p-8 text-center bg-red-500/5 border-red-500/20">
          <p className="text-red-400 mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm text-white/60 hover:text-white underline">Retry Connection</button>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Info className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Active Scenarios</h3>
          <p className="text-white/40 max-w-sm mb-6">
            There are currently no engineering scenarios defined for this facility. 
            Once site-specific layout alternatives are modeled, they will appear here for impact analysis.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="glass-card overflow-hidden">
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/20">
                <div>
                  <h3 className="text-lg font-semibold text-white">{scenario.name}</h3>
                  <p className="text-sm text-white/60 mt-0.5">Created on {new Date(scenario.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/60">
                  Ready for Simulation
                </span>
              </div>
              
              <div className="p-6">
                <p className="text-sm text-white/80 mb-4">{scenario.description || 'No detailed description provided for this scenario.'}</p>
                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 text-sm font-medium text-white/80 bg-white/5 border border-white/20 rounded-md hover:bg-white/10 transition-colors">Run Simulation</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Beta Notice */}
      <div className="mt-12 p-4 rounded-xl border border-white/5 bg-white/2 flex items-center">
        <div className="w-8 h-8 rounded-lg bg-[#7000ff]/20 flex items-center justify-center mr-4 border border-[#7000ff]/30">
          <GitCompare className="w-4 h-4 text-[#7000ff]" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Engineering Note</h4>
          <p className="text-[11px] text-white/40 mt-0.5">
            Scenario impact modeling uses spatial pathfinding and interaction risk algorithms. 
            Estimated impacts are calculated based on active CAD layers and current traffic density data.
          </p>
        </div>
      </div>
    </div>
  );
}
