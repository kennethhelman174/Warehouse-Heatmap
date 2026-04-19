import React, { useEffect, useState } from 'react';
import { Building2, Loader2, Info, ArrowUpRight } from 'lucide-react';
import { financeApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export function Benchmarking() {
  const { activeFacility } = useAppStore();
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBenchmarks() {
      if (!activeFacility) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await financeApi.getBenchmarks({ facilityId: activeFacility.id });
        setBenchmarks(res.data);
      } catch (err: any) {
        setError('Failed to load benchmarking data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBenchmarks();
  }, [activeFacility]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/60">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#00d4ff]" />
        <p>Retrieving network performance data...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b border-white/10 shrink-0">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Building2 className="w-6 h-6 text-[#00d4ff] mr-2" />
          Multi-Site Benchmarking
        </h2>
        <p className="text-white/60 text-sm mt-1">Compare warehouse performance, risk, and engineering opportunity across the network.</p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {error ? (
          <div className="glass-card p-8 text-center bg-red-500/5 border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        ) : benchmarks.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Benchmarking Not Configured</h3>
            <p className="text-white/40 max-w-sm mb-6">
              Network-wide benchmarking requires multiple facilities and a configured reporting period. 
              Once site data is reconciled, cross-site comparisons will be available here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benchmarks.slice(0, 3).map((bm) => (
                <div key={bm.id} className="glass-card p-5">
                  <h3 className="text-sm font-medium text-white/60 mb-1">{bm.metricKey.replace(/_/g, ' ').toUpperCase()}</h3>
                  <div className="text-3xl font-bold text-white">{bm.value}</div>
                  {bm.comparedToIndustry && (
                    <div className={`text-xs mt-2 flex items-center ${bm.comparedToIndustry > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <ArrowUpRight className="w-3 h-3 mr-1" /> 
                      {Math.abs(bm.comparedToIndustry)}% vs industry
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-white/10 bg-black/20">
                <h3 className="font-semibold text-white">Facility Performance Metrics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-white/80">
                  <thead className="text-xs text-white/60 uppercase bg-black/20">
                    <tr>
                      <th className="px-6 py-3">Metric</th>
                      <th className="px-6 py-3 text-right">Value</th>
                      <th className="px-6 py-3 text-right">Reporting Period</th>
                      <th className="px-6 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {benchmarks.map((bm) => (
                      <tr key={bm.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{bm.metricKey.replace(/_/g, ' ').toUpperCase()}</td>
                        <td className="px-6 py-4 text-right font-mono">{bm.value}</td>
                        <td className="px-6 py-4 text-right text-white/40">{bm.period}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest border border-white/10">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
