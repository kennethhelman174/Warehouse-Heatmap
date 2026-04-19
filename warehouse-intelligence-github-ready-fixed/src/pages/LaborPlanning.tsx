import React, { useEffect, useState } from 'react';
import { Users, Loader2, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import { laborApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export function LaborPlanning() {
  const { activeFacility } = useAppStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLaborData() {
      if (!activeFacility) return;
      setIsLoading(true);
      setError(null);
      try {
        const [plansRes, recordsRes] = await Promise.all([
          laborApi.getPlans({ facilityId: activeFacility.id }),
          laborApi.getRecords({ facilityId: activeFacility.id })
        ]);
        setPlans(plansRes.data);
        setRecords(recordsRes.data);
      } catch (err: any) {
        setError('Failed to load labor planning data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLaborData();
  }, [activeFacility]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/60">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#00d4ff]" />
        <p>Analyzing labor intensity and traffic density...</p>
      </div>
    );
  }

  const totalHeadcount = plans.reduce((acc, p) => acc + (p.headcountTarget || 0), 0);
  const totalVolume = plans.reduce((acc, p) => acc + (p.volumeTarget || 0), 0);
  const throughput = totalHeadcount > 0 ? (totalVolume / totalHeadcount).toFixed(1) : '0.0';

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b border-white/10 shrink-0">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Users className="w-6 h-6 text-[#00d4ff] mr-2" />
          Labor Overlay & Planning
        </h2>
        <p className="text-white/60 text-sm mt-1">Compare warehouse travel heat and activity intensity against staffing levels.</p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {error ? (
          <div className="glass-card p-8 text-center bg-red-500/5 border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Labor Plan Not Configured</h3>
            <p className="text-white/40 max-w-sm mb-6">
              Activity data and headcount targets are needed to generate labor overlays. 
              Import labor records or define site plans to enable this module.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-5">
                <h3 className="text-sm font-medium text-white/60 mb-1">Target Headcount</h3>
                <div className="text-3xl font-bold text-white">{totalHeadcount}</div>
                <div className="text-xs text-white/40 mt-2">Aggregated across all shifts</div>
              </div>
              <div className="glass-card p-5">
                <h3 className="text-sm font-medium text-white/60 mb-1">Plan Volume (Cases)</h3>
                <div className="text-3xl font-bold text-white">{totalVolume.toLocaleString()}</div>
                <div className="text-xs text-white/40 mt-2">Expected pick volume</div>
              </div>
              <div className="glass-card p-5">
                <h3 className="text-sm font-medium text-white/60 mb-1">Expected Efficiency</h3>
                <div className="text-3xl font-bold text-[#00d4ff]">{throughput}</div>
                <div className="text-xs text-white/40 mt-2">Units per labor hour</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-white/10 bg-black/20">
                  <h3 className="font-semibold text-white">Shift Allocation</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-white/80">
                    <thead className="text-xs text-white/60 uppercase bg-black/20">
                      <tr>
                        <th className="px-6 py-3">Shift</th>
                        <th className="px-6 py-3 text-right">Headcount</th>
                        <th className="px-6 py-3 text-right">Volume</th>
                        <th className="px-6 py-3 text-right">Target Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {plans.map((plan) => (
                        <tr key={plan.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-medium">{plan.shift}</td>
                          <td className="px-6 py-4 text-right">{plan.headcountTarget}</td>
                          <td className="px-6 py-4 text-right">{plan.volumeTarget?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">{(plan.volumeTarget / plan.headcountTarget || 0).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-card p-6 flex flex-col justify-center items-center text-center opacity-75">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-md font-bold text-white mb-2">Imbalance Analysis Pending</h3>
                <p className="text-sm text-white/40 max-w-xs">
                  Real-time spatial activity (forklift/pedestrian) is required to calculate staffing imbalance scores.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
