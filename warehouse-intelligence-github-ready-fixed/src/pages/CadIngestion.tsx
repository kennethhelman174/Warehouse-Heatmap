import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle, Map as MapIcon, Database, ArrowRight } from 'lucide-react';
import { cadApi, zoneApi } from '../services/api';
import { CadEntity, DetectedWarehouseElement } from '../services/cad/types';
import { useMapStore } from '../store/useMapStore';

export function CadIngestion() {
  const { fetchData } = useMapStore();
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [entities, setEntities] = useState<CadEntity[]>([]);
  const [detectedElements, setDetectedElements] = useState<DetectedWarehouseElement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsParsing(true);
    setError(null);
    setSuccess(null);
    setEntities([]);
    setDetectedElements([]);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await cadApi.upload(formData);
      setEntities(response.data.rawEntities || []);
      setDetectedElements(response.data.detectedElements || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (detectedElements.length === 0) return;
    setIsImporting(true);
    setError(null);
    try {
      // Import zones one by one or batch if supported
      for (const el of detectedElements) {
        await zoneApi.create({
          id: `cad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `CAD ${el.type} ${el.id.substr(0, 4)}`,
          type: el.type,
          x: el.geometry.x,
          y: el.geometry.y,
          width: el.geometry.width,
          height: el.geometry.height,
          color: el.type === 'rack' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(112, 0, 255, 0.2)'
        });
      }
      setSuccess(`Successfully imported ${detectedElements.length} elements to the active map.`);
      setDetectedElements([]);
      fetchData();
    } catch (err: any) {
      setError('Import failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center">
        <MapIcon className="w-6 h-6 text-[#00d4ff] mr-2" />
        CAD Floorplan Ingestion
      </h2>
      
      <div className="glass-card p-6">
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 text-white/60 mb-3" />
            <p className="mb-2 text-sm text-white/80"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-white/60">DXF files supported</p>
          </div>
          <input type="file" accept=".dxf" className="hidden" onChange={handleFileUpload} disabled={isParsing} />
        </label>
      </div>

      {isParsing && (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="w-8 h-8 animate-spin text-[#7000ff]" />
          <span className="ml-3 text-white">Parsing CAD geometry...</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {entities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Raw CAD Entities ({entities.length})</h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm text-left text-white/60">
                <thead className="text-xs text-white/60 uppercase border-b border-white/10">
                  <tr>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Layer</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.slice(0, 50).map((ent) => (
                    <tr key={ent.id} className="border-b border-white/5">
                      <td className="px-4 py-2 text-white/80">{ent.id}</td>
                      <td className="px-4 py-2">{ent.type}</td>
                      <td className="px-4 py-2">{ent.layer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {entities.length > 50 && (
                <div className="p-2 text-center text-xs text-white/40">Showing first 50 entities</div>
              )}
            </div>
          </div>

          <div className="glass-card p-6 border-[#00d4ff]/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Database className="w-5 h-5 text-[#00d4ff] mr-2" />
                Auto-Detected Elements ({detectedElements.length})
              </h3>
              <button 
                onClick={handleImport}
                disabled={detectedElements.length === 0 || isImporting}
                className="px-4 py-2 bg-[#7000ff] text-white text-sm font-bold rounded hover:bg-[#5a00cc] transition-colors disabled:opacity-50 flex items-center"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                Import to Map
              </button>
            </div>
            
            {detectedElements.length === 0 ? (
              <div className="text-white/40 text-sm text-center py-10">
                No logical warehouse elements could be confidently matched by layer or heuristic.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {detectedElements.map((el) => (
                  <div key={el.id} className="bg-black/30 p-3 rounded border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium capitalize">{el.type}</div>
                      <div className="text-white/60 text-xs mt-1">
                        Boundaries: {el.geometry.width.toFixed(1)} x {el.geometry.height.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${el.confidence > 0.8 ? 'text-green-400' : 'text-orange-400'}`}>
                        {(el.confidence * 100).toFixed(0)}% Match
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
