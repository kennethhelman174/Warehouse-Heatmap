import React, { useEffect, useState } from 'react';
import { DollarSign, Loader2, Info, TrendingDown, Settings2 } from 'lucide-react';
import { financeApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export function CostModeling() {
  const { activeFacility } = useAppStore();
  const [assumptions, setAssumptions] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFinanceData() {
      if (!activeFacility) return;
      setIsLoading(true);
      setError(null);
      try {
        const [assumptionsRes, benchmarksRes] = await Promise.all([
          financeApi.getAssumptions({ facilityId: activeFacility.id }),
          financeApi.getBenchmarks({ facilityId: activeFacility.id })
        ]);
        setAssumptions(assumptionsRes.data);
        setBenchmarks(benchmarksRes.data);
      } catch (err: any) {
        setError('Failed to load financial modeling data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFinanceData();
  }, [activeFacility]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/60">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-green-400" />
        <p>Calculating actuarial impacts and spatial ROI...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b border-white/10 shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <DollarSign className="w-6 h-6 text-green-400 mr-2" />
            Cost Impact Modeling
          </h2>
          <p className="text-white/60 text-sm mt-1">Translate spatial inefficiencies and risks into estimated business impact.</p>
        </div>
        <button 
          disabled
          className="flex items-center px-4 py-2 bg-white/5 border border-white/20 text-white/50 text-sm font-medium rounded-md cursor-not-allowed"
          title="Assumption editing coming soon"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Edit Assumptions
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {error ? (
          <div className="glass-card p-8 text-center bg-red-500/5 border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        ) : assumptions.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
              <DollarSign className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Cost Model Not Configured</h3>
            <p className="text-white/40 max-w-sm mb-6">
              Financial impacts require site-specific cost assumptions (labor hourly rates, rental costs, etc.). 
              Configure your site's cost basis to enable actuarial projections.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {assumptions.map((assump) => (
                <div key={assump.id} className="glass-card p-5">
                  <h3 className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">{assump.key.replace(/_/g, ' ')}</h3>
                  <div className="text-2xl font-bold text-white">
                    {assump.unit === '$' ? `$${assump.value}` : `${assump.value}${assump.unit || ''}`}
                  </div>
                  <div className="text-[10px] text-white/40 mt-1">Effective: {new Date(assump.effectiveDate).toLocaleDateString()}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Financial Benchmarks</h3>
                <div className="space-y-4">
                  {benchmarks.length > 0 ? (
                    benchmarks.map((bm) => (
                      <div key={bm.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/80">{bm.metricKey.replace(/_/g, ' ').toUpperCase()} ({bm.period})</span>
                          <span className="font-medium text-white">{bm.value}</span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: bm.comparedToIndustry ? `${Math.min(100, 100 + bm.comparedToIndustry)}%` : '50%' }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/40 italic text-center py-8">No historical benchmarks found for this period.</p>
                  )}
                </div>
              </div>

              <div className="glass-card p-6 flex flex-col justify-center items-center text-center opacity-75">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <TrendingDown className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-md font-bold text-white mb-2">ROI Projections Pending</h3>
                <p className="text-sm text-white/40 max-w-xs">
                  Projections require an approved engineering scenario and active labor intensity data to calculate annualized savings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
