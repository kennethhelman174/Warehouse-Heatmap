import React, { useState, useEffect } from 'react';
import { Upload, Database, CheckCircle2, AlertCircle, Clock, ChevronRight, FileText, Download, Loader2, ArrowRight, Play, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { importApi } from '../services/api';
import { cn } from '../lib/utils';

type JobStatus = 'uploading' | 'processing' | 'staged' | 'failed_validation' | 'completed' | 'error';

interface ImportJob {
  id: string;
  sourceType: string;
  fileName: string;
  status: JobStatus;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  createdAt: string;
}

export default function DataIngestion() {
  const { activeFacility } = useAppStore();
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sourceType, setSourceType] = useState('zones');
  const [file, setFile] = useState<File | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await importApi.getJobs();
      setJobs(res.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceType', sourceType);

    try {
      await importApi.upload(formData);
      setFile(null);
      fetchJobs();
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const fetchJobDetails = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      const res = await importApi.getJobDetails(id);
      setJobDetails(res.data);
      setSelectedJobId(id);
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCommit = async () => {
    if (!selectedJobId || !activeFacility) return;
    try {
      await importApi.commitJob(selectedJobId, {
        facilityId: activeFacility.id,
        versionId: 'v1' // Defaulting to v1 for now
      });
      fetchJobs();
      fetchJobDetails(selectedJobId);
    } catch (err) {
      console.error('Commit error:', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Data Ingestion Center</h1>
          <p className="text-white/40 mt-1">Industrial-grade operational data ingestion and transformation.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button className="px-4 py-2 bg-[#7000ff] text-white rounded-lg text-sm font-bold shadow-lg shadow-[#7000ff]/20">Active Pipelines</button>
          <button className="px-4 py-2 text-white/40 hover:text-white text-sm font-bold transition-colors">Audit Logs</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Connection & Upload Panel */}
        <div className="lg:col-span-1 space-y-6">
          <section className="glass-card p-6 border-[#7000ff]/20 bg-[#7000ff]/5">
            <div className="flex items-center space-x-3 mb-6">
              <Upload className="w-5 h-5 text-[#7000ff]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Ingestion Wizard</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Source Objective</label>
                <select 
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-[#7000ff] outline-none transition-all"
                >
                  <option value="zones">Warehouse Zones</option>
                  <option value="rack_master">Rack Master Data</option>
                  <option value="events">Telemetry Events</option>
                  <option value="observations">Spatial Observations</option>
                  <option value="labor">Labor & Productivity</option>
                  <option value="benchmarks">Benchmark Metrics</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Payload (CSV/XLSX)</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    accept=".csv,.xlsx,.xls"
                  />
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center group-hover:border-[#7000ff]/50 transition-all bg-black/20">
                    <Database className="w-8 h-8 text-white/20 mb-3 group-hover:text-[#7000ff]/50 transition-colors" />
                    <span className="text-xs text-white/60 text-center">
                      {file ? file.name : "Drop file or click to browse"}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full bg-[#7000ff] hover:bg-[#5a00cc] disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-xl shadow-[#7000ff]/20 transition-all flex justify-center items-center"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initiate Ingestion"}
              </button>
            </div>
          </section>

          <section className="glass-card p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Ingestion History</h3>
            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {jobs.map(job => (
                <div 
                  key={job.id} 
                  onClick={() => fetchJobDetails(job.id)}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer group",
                    selectedJobId === job.id 
                      ? "bg-[#7000ff]/10 border-[#7000ff]/30 ring-1 ring-[#7000ff]/20" 
                      : "bg-white/5 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{job.id}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <h4 className="text-sm font-medium text-white truncate">{job.fileName}</h4>
                  <div className="flex items-center justify-between mt-3 text-[10px] uppercase font-bold tracking-tighter">
                    <span className="text-white/30">{new Date(job.createdAt).toLocaleDateString()}</span>
                    <span className="text-white/60">{job.sourceType}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Workspace / Detail Area */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {!selectedJobId ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-[600px] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-white/20 p-12 text-center"
              >
                <ArrowRight className="w-12 h-12 mb-6 animate-pulse" />
                <h3 className="text-xl font-bold text-white/40">Select a pipeline job to view spatial diagnostics and commitment status</h3>
                <p className="max-w-md mt-2 text-sm">Every ingestion provides row-level validation, lineage tracking, and staging options before data hits production tables.</p>
              </motion.div>
            ) : isLoadingDetails ? (
              <div className="h-[600px] flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#7000ff]" />
              </div>
            ) : jobDetails && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/10">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <FileText className="w-8 h-8 text-[#7000ff]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{jobDetails.job.fileName}</h2>
                      <p className="text-sm text-white/40">Job ID: {jobIdDisplay(jobDetails.job.id)} • {jobDetails.job.sourceType}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    {jobDetails.job.status === 'staged' && (
                      <button 
                        onClick={handleCommit}
                        className="flex items-center px-6 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all"
                      >
                        <Play className="w-4 h-4 mr-2 capitalize" />
                        Commit to Production
                      </button>
                    )}
                    <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <MetricCard title="Total Observations" value={jobDetails.job.totalRows} icon={Database} color="blue" />
                  <MetricCard title="Successful Validation" value={jobDetails.job.successfulRows} icon={CheckCircle2} color="green" />
                  <MetricCard title="Validation Errors" value={jobDetails.job.failedRows} icon={AlertCircle} color="red" />
                </div>

                <div className="glass-card p-6 min-h-[400px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white">Diagnostics & Staging</h3>
                    <div className="flex text-[10px] font-bold bg-black/40 p-1 rounded-lg border border-white/10">
                      <button className="px-3 py-1 bg-white/10 text-white rounded">Errors ({jobDetails.errors.length})</button>
                      <button className="px-3 py-1 text-white/40 hover:text-white">Staged ({jobDetails.staging.length})</button>
                    </div>
                  </div>

                  {jobDetails.errors.length > 0 ? (
                    <div className="space-y-2">
                       {jobDetails.errors.map((err: any) => (
                         <div key={err.id} className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start space-x-4">
                           <div className="w-6 h-6 bg-red-500/20 rounded text-red-400 flex items-center justify-center shrink-0 font-mono text-[10px]">
                             {err.rowNumber}
                           </div>
                           <div>
                             <p className="text-sm text-red-200">{err.errorMessage}</p>
                             <div className="mt-2 p-2 bg-black/20 rounded font-mono text-[8px] text-white/40 overflow-hidden text-ellipsis whitespace-nowrap">
                               {err.rawData}
                             </div>
                           </div>
                         </div>
                       ))}
                    </div>
                  ) : jobDetails.staging.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest">
                            <th className="py-4 px-2">Row</th>
                            <th className="py-4 px-2">Data Payload</th>
                            <th className="py-4 px-2">Integrity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobDetails.staging.map((row: any) => (
                            <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                               <td className="py-3 px-2 text-white/40">{row.rowNumber}</td>
                               <td className="py-3 px-2">
                                  <div className="max-w-md truncate font-mono text-white/60">
                                    {row.dataJson}
                                  </div>
                               </td>
                               <td className="py-3 px-2">
                                  <span className="flex items-center text-green-400 font-bold">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    VALID
                                  </span>
                               </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-white/20">
                       <Clock className="w-8 h-8 mb-2" />
                       <p className="text-sm">Processing ingestion payload...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
  const colorMap = {
    green: 'text-green-400 bg-green-400/10 border-green-500/20',
    red: 'text-red-400 bg-red-400/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
  };
  const selectedColor = colorMap[color as keyof typeof colorMap] || colorMap.blue;
  
  return (
    <div className={cn("p-6 rounded-3xl border flex flex-col items-center justify-center text-center", selectedColor)}>
      <Icon className="w-6 h-6 mb-3" />
      <div className="text-2xl font-bold font-mono text-white">{value}</div>
      <div className="text-[10px] uppercase font-bold tracking-widest opacity-60 mt-1">{title}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    uploading: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    staged: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    failed_validation: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border",
      styles[status as keyof typeof styles] || styles.error
    )}>
      {status.replace('_', ' ')}
    </span>
  );
}

function jobIdDisplay(id: string) {
  return id.length > 10 ? id.substring(0, 10) + '...' : id;
}
