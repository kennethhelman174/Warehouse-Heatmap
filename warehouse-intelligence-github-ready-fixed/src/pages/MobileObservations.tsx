import React, { useState, useEffect } from 'react';
import { Smartphone, MapPin, Camera, AlertTriangle, Send, Loader2, CheckCircle2, Menu } from 'lucide-react';
import { observationApi } from '../services/api';
import { useMapStore } from '../store/useMapStore';
import { useAppStore } from '../store/useAppStore';

export function MobileObservations() {
  const { facilityId } = useMapStore();
  const { activeFacility } = useAppStore();
  const [type, setType] = useState('hazard');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Set mobile viewport height property for better rendering on iOS/Android browsers
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    
    setIsSubmitting(true);
    try {
      const severityScore = severity === 'low' ? 3 : severity === 'medium' ? 6 : 9;
      
      let x = 50;
      let y = 50;

      // Real geolocation attempt
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          console.log('Mobile Observation GPS:', position.coords.latitude, position.coords.longitude);
        } catch (geoErr) {
          console.warn('Geolocation failed, falling back to facility center', geoErr);
        }
      }

      await observationApi.create({
        facilityId: facilityId || activeFacility?.id || 'f1',
        type: type,
        x,
        y,
        severity: severityScore,
        description
      });
      setSubmitStatus('success');
      setDescription('');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Override layout container bounds specifically for this route to go full screen
    <div className="absolute inset-0 z-50 bg-[#050510] flex flex-col sm:relative sm:z-auto sm:inset-auto sm:h-full sm:max-w-md mx-auto w-full border-x border-white/10" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Mobile Header */}
      <div className="p-4 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center">
          <Smartphone className="w-5 h-5 text-[#00d4ff] mr-2" />
          Log Observation
        </h2>
        {/* Placeholder for a mobile menu toggle if needed later, right now just a close/cancel visual */}
        <button className="text-sm text-white/60 hover:text-white" onClick={() => window.history.back()}>Close</button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-6 pb-24 custom-scrollbar">
        {submitStatus === 'success' && (
          <div className="p-3 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg flex items-center shadow-lg shadow-green-500/10">
            <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
            Observation submitted successfully!
          </div>
        )}
        {submitStatus === 'error' && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg flex items-center shadow-lg shadow-red-500/10">
            <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
            Failed to submit observation.
          </div>
        )}

        {/* Location Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">Location</label>
          <div className="flex items-center p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
            <MapPin className="w-5 h-5 text-[#7000ff] mr-3" />
            <div className="flex-1">
              <div className="text-sm text-white">Tap to select on map</div>
              <div className="text-xs text-white/40">Or use current location</div>
            </div>
          </div>
        </div>

        {/* Observation Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setType('hazard')}
              className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center justify-center transition-colors ${type === 'hazard' ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'bg-white/5 border-white/10 text-white/60'}`}
            >
              <AlertTriangle className="w-5 h-5 mb-1" />
              Hazard
            </button>
            <button 
              onClick={() => setType('congestion')}
              className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center justify-center transition-colors ${type === 'congestion' ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' : 'bg-white/5 border-white/10 text-white/60'}`}
            >
              <AlertTriangle className="w-5 h-5 mb-1" />
              Congestion
            </button>
            <button 
              onClick={() => setType('near_miss')}
              className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center justify-center transition-colors ${type === 'near_miss' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : 'bg-white/5 border-white/10 text-white/60'}`}
            >
              <AlertTriangle className="w-5 h-5 mb-1" />
              Near Miss
            </button>
            <button 
              onClick={() => setType('other')}
              className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center justify-center transition-colors ${type === 'other' ? 'bg-[#00d4ff]/20 border-[#00d4ff]/50 text-[#00d4ff]' : 'bg-white/5 border-white/10 text-white/60'}`}
            >
              <AlertTriangle className="w-5 h-5 mb-1" />
              Other
            </button>
          </div>
        </div>

        {/* Severity */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">Severity</label>
          <div className="flex bg-black/20 rounded-lg p-1 border border-white/10">
            <button 
              onClick={() => setSeverity('low')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${severity === 'low' ? 'bg-white/20 text-white' : 'text-white/60'}`}
            >
              Low
            </button>
            <button 
              onClick={() => setSeverity('medium')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${severity === 'medium' ? 'bg-white/20 text-white' : 'text-white/60'}`}
            >
              Medium
            </button>
            <button 
              onClick={() => setSeverity('high')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${severity === 'high' ? 'bg-red-500/40 text-white' : 'text-white/60'}`}
            >
              High
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">Description</label>
          <textarea 
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:ring-[#7000ff] focus:border-[#7000ff] placeholder-white/30"
            placeholder="Describe what you observed..."
          ></textarea>
        </div>

        {/* Photo Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">Photo (Optional)</label>
          <button className="w-full py-4 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center text-white/60 hover:bg-white/5 hover:text-white transition-colors">
            <Camera className="w-6 h-6 mb-2" />
            <span className="text-sm">Take Photo or Upload</span>
          </button>
        </div>
      </div>

      {/* Mobile Footer / Submit */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-lg border-t border-white/10">
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !description.trim()}
          className="w-full flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#7000ff] to-[#00d4ff] hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {isSubmitting ? 'Submitting...' : 'Submit Observation'}
        </button>
      </div>
    </div>
  );
}
