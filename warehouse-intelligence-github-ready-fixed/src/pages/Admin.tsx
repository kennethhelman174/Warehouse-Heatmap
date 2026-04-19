import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, Database, Shield, Upload, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { facilityApi, importApi } from '../services/api';

export function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeFacility, fetchFacility } = useAppStore();
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [facilityName, setFacilityName] = useState(activeFacility?.name || 'Main Distribution Center');
  const [facilityWidth, setFacilityWidth] = useState(activeFacility?.width || 100);
  const [facilityHeight, setFacilityHeight] = useState(activeFacility?.height || 80);

  React.useEffect(() => {
    if (activeFacility) {
      setFacilityName(activeFacility.name);
      setFacilityWidth(activeFacility.width);
      setFacilityHeight(activeFacility.height);
    }
  }, [activeFacility]);

  if (user?.role !== 'Admin') {
    return <div className="p-6 text-white text-center flex flex-col items-center justify-center h-full">
      <Shield className="w-12 h-12 text-red-500 mb-4 opacity-50" />
      <h3 className="text-xl font-bold">Access Restricted</h3>
      <p className="text-white/40 max-w-md mt-2 italic text-sm">You do not have administrative privileges required to manage facility configurations or user permissions.</p>
    </div>;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, sourceType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus({ type: null, message: '' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceType', sourceType);

    try {
      await importApi.upload(formData);
      setImportStatus({ type: 'success', message: 'Import job launched successfully. Telemetry and structural data are being synchronized.' });
    } catch (err: any) {
      setImportStatus({ type: 'error', message: 'System error during import: ' + (err.response?.data?.message || err.message) });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveFacility = async () => {
    if (!activeFacility) return;
    setIsSaving(true);
    try {
      await facilityApi.update(activeFacility.id, {
        name: facilityName,
        width: Number(facilityWidth),
        height: Number(facilityHeight)
      });
      await fetchFacility();
      setImportStatus({ type: 'success', message: 'Facility architectural parameters updated successfully.' });
    } catch (err: any) {
      setImportStatus({ type: 'error', message: 'Failed to update facility: ' + (err.response?.data?.message || err.message) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Settings className="w-6 h-6 text-[#00d4ff] mr-2" />
            Administration
          </h2>
          <p className="text-white/60 text-sm mt-1">Manage users, facilities, and system configuration.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          className="glass-card p-6 border-white/5 hover:bg-white/5 hover:border-[#00d4ff]/30 cursor-pointer transition-all group" 
          onClick={() => navigate('/cad-ingestion')}
        >
          <div className="w-12 h-12 rounded-xl bg-[#00d4ff]/10 flex items-center justify-center mb-6 border border-[#00d4ff]/20 group-hover:bg-[#00d4ff]/20 transition-all">
            <Database className="w-6 h-6 text-[#00d4ff]" />
          </div>
          <h3 className="text-xl font-bold text-white">CAD Layout Ingestion</h3>
          <p className="text-sm text-white/40 mt-2 leading-relaxed">Import facility architecture directly from DXF geometry. Automatically detects zones and structural obstacles.</p>
          <div className="mt-6 flex items-center text-xs font-bold text-[#00d4ff] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Launch Importer</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>

        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
            <Shield className="w-6 h-6 text-white/40" />
          </div>
          <h3 className="text-xl font-bold text-white/60">System Audit Logs</h3>
          <p className="text-sm text-white/20 mt-2">Historical trace of all engineering modifications and scenario approvals.</p>
          <span className="absolute top-4 right-4 text-[9px] font-bold bg-white/5 text-white/40 px-2 py-1 rounded border border-white/10 uppercase tracking-tighter">Coming Soon</span>
        </div>
      </div>

      <div className="glass-card mt-8">
        <div className="p-5 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Facility Configuration</h3>
        </div>
        <div className="p-6">
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Facility Narrative Name</label>
              <input 
                type="text" 
                value={facilityName}
                onChange={e => setFacilityName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:border-[#7000ff] outline-none transition-all" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Model Width (FT)</label>
                <input 
                  type="number" 
                  value={facilityWidth}
                  onChange={e => setFacilityWidth(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:border-[#7000ff] outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Model Height (FT)</label>
                <input 
                  type="number" 
                  value={facilityHeight}
                  onChange={e => setFacilityHeight(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:border-[#7000ff] outline-none transition-all" 
                />
              </div>
            </div>
            <div className="pt-4">
              <button 
                onClick={handleSaveFacility}
                disabled={isSaving}
                className="flex items-center px-6 py-2.5 bg-[#7000ff] text-white text-xs font-bold rounded-xl hover:bg-[#5a00cc] transition-all shadow-[0_0_20px_rgba(112,0,255,0.2)] disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                PROPAGATE CHANGES
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
