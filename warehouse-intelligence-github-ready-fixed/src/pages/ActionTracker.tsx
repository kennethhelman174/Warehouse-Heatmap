import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { actionApi } from '../services/api';
import { NewActionModal } from '../components/NewActionModal';

export function ActionTracker() {
  const [actions, setActions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchActions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await actionApi.getAll();
      setActions(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Neural bridge for maintenance logs is currently offline. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await actionApi.updateStatus(id, status);
      setActions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err: any) {
      console.error('Failed to update status', err);
      setError('System rejected status transition. Verify IE authorization.');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b border-white/10 shrink-0 flex justify-between items-center bg-black/40 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <CheckSquare className="w-6 h-6 text-[#7000ff] mr-2" />
            Remediation Action Tracker
          </h2>
          <p className="text-white/60 text-sm mt-1">Managed execution of warehouse engineering improvements.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-[#7000ff] text-white text-sm font-bold rounded-md hover:bg-[#5a00cc] transition-all shadow-[0_0_20px_rgba(112,0,255,0.2)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          SYSTEM ACTION
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center shadow-lg">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-400">
              <Plus className="w-4 h-4 rotate-45" />
            </button>
          </div>
        )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Clock className="w-12 h-12" /></div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Open Items</div>
              <div className="text-2xl font-bold text-white">{actions.filter(a => (a.status || '').toLowerCase() === 'open').length}</div>
            </div>
            <div className="glass-card p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Loader2 className="w-12 h-12" /></div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">In Progress</div>
              <div className="text-2xl font-bold text-[#00d4ff]">{actions.filter(a => (a.status || '').toLowerCase() === 'in progress').length}</div>
            </div>
            <div className="glass-card p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><CheckSquare className="w-12 h-12" /></div>
              <div className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest mb-1">Resolved</div>
              <div className="text-2xl font-bold text-green-400">{actions.filter(a => (a.status || '').toLowerCase() === 'completed').length}</div>
            </div>
            <div className="glass-card p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><AlertCircle className="w-12 h-12" /></div>
              <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-1">Audit Verified</div>
              <div className="text-2xl font-bold text-white">{actions.filter(a => (a.status || '').toLowerCase() === 'verified').length}</div>
            </div>
          </div>

        <div className="glass-card">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
            <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">Operational Backlog</h3>
            <div className="flex space-x-2">
              <select className="bg-black/40 border border-white/10 text-white/60 text-[11px] font-bold rounded-md px-3 py-1.5 focus:border-[#7000ff] outline-none">
                <option>All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Verified">Verified</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-white/60">
              <thead className="text-[10px] text-white/40 uppercase tracking-widest bg-black/20">
                <tr>
                  <th className="px-6 py-4">Title / Description</th>
                  <th className="px-6 py-4">Context Area</th>
                  <th className="px-6 py-4">Classification</th>
                  <th className="px-6 py-4">Responsible</th>
                  <th className="px-6 py-4">Target Date</th>
                  <th className="px-6 py-4">Lifecycle State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#7000ff]" /></td></tr>
                ) : actions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-20 text-white/20 italic">No historical remediation records found.</td></tr>
                ) : (
                  actions.map(action => (
                    <tr key={action.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white/90">{action.title}</div>
                        <div className="text-[10px] text-white/40 mt-1 line-clamp-1">{action.description || 'No detailed brief provided.'}</div>
                      </td>
                      <td className="px-6 py-4 font-mono">{action.zone || 'Global'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-bold">
                          {action.category || 'Maintenance'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{action.owner}</td>
                      <td className={`px-6 py-4 font-mono ${action.dueDate && new Date(action.dueDate) < new Date() && action.status !== 'Verified' ? 'text-red-400' : ''}`}>
                        {action.dueDate || 'No Date'}
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={action.status} 
                          onChange={(e) => updateStatus(action.id, e.target.value)}
                          className={`bg-black/40 text-[10px] font-bold rounded px-2 py-1.5 border border-white/10 outline-none transition-all ${
                            action.status === 'Open' ? 'text-white' : 
                            action.status === 'In Progress' ? 'text-[#00d4ff] border-[#00d4ff]/30' : 
                            action.status === 'Completed' ? 'text-green-400 border-green-500/30' : 'text-yellow-400 border-yellow-500/30'
                          }`}
                        >
                          <option value="Open">OPEN</option>
                          <option value="In Progress">IN PROGRESS</option>
                          <option value="Completed">COMPLETED</option>
                          <option value="Verified">VERIFIED (IE)</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <NewActionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchActions}
      />
    </div>
  );
}
