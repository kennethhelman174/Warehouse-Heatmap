import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppStore } from '../../store/useAppStore';
import { useMapStore } from '../../store/useMapStore';

export function AppLayout() {
  const { activeFacility, fetchFacility } = useAppStore();
  const { setFacilityId } = useMapStore();

  useEffect(() => {
    fetchFacility();
  }, [fetchFacility]);

  useEffect(() => {
    if (activeFacility) {
      setFacilityId(activeFacility.id);
    }
  }, [activeFacility, setFacilityId]);

  return (
    <div className="relative h-screen w-screen overflow-hidden text-white font-sans">
      <div className="background-mesh"></div>
      <div className="flex h-full p-5 gap-5">
        <Sidebar />
        <div className="flex flex-col flex-1 gap-5 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto glass-panel">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
