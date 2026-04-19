import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map, Flame, Route, GitCompare, ShieldAlert, Settings, Users, DollarSign, CheckSquare, Smartphone, Building2, LogOut, User, Layers, Database, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS, Role } from '../../types';

export function Sidebar() {
  const { user, logout, checkPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Map Workspace', path: '/map', icon: Map },
    { name: 'Heatmaps', path: '/heatmaps', icon: Flame },
    { name: 'Route Simulation', path: '/routes', icon: Route },
    { name: 'Rack Elevation', path: '/racks', icon: Layers },
    { name: 'Safety Engine', path: '/safety', icon: ShieldAlert },
    { name: 'Digital Inspections', path: '/observations', icon: Smartphone },
    { name: 'Action Tracker', path: '/actions', icon: CheckSquare },
    { name: 'Engineering Console', path: '/engineering', icon: Zap, roles: PERMISSIONS.CAN_ACCESS_ENGINEERING },
    { name: 'Admin Control', path: '/admin', icon: Settings, roles: PERMISSIONS.CAN_ACCESS_ADMIN },
  ];

  const simulationItems = [
    { name: 'Labor Planning', path: '/labor', icon: Users, roles: PERMISSIONS.CAN_VIEW_SIMULATIONS },
    { name: 'Scenarios', path: '/scenarios', icon: GitCompare, roles: PERMISSIONS.CAN_VIEW_SIMULATIONS },
    { name: 'Cost Modeling', path: '/cost', icon: DollarSign, roles: PERMISSIONS.CAN_VIEW_SIMULATIONS },
    { name: 'Benchmarking', path: '/benchmarking', icon: Building2, roles: PERMISSIONS.CAN_VIEW_SIMULATIONS },
  ];

  const filteredItems = navItems.filter(item => !item.roles || checkPermission(item.roles));
  const filteredSimulationItems = simulationItems.filter(item => !item.roles || checkPermission(item.roles));

  return (
    <div className="w-64 glass-panel flex flex-col h-full">
      <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7000ff] to-[#00d4ff] flex items-center justify-center mr-3 shadow-lg shadow-[#7000ff]/20">
          <Map className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">WH Intelligence</span>
      </div>
      <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1.5 px-4 mb-8">
          {filteredItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-transparent tracking-wide uppercase",
                    isActive
                      ? "bg-white/10 text-white border-white/10 shadow-lg"
                      : "text-white/40 hover:bg-white/5 hover:text-white"
                  )
                }
              >
                <item.icon className={cn("w-4 h-4 mr-3 shrink-0", "text-inherit")} />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Simulation Section */}
        {filteredSimulationItems.length > 0 && (
          <>
            <div className="px-8 mb-4">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Simulation Sandbox</p>
            </div>
            <ul className="space-y-1 px-4">
              {filteredSimulationItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-4 py-2 rounded-lg text-xs font-medium transition-all group",
                        isActive
                          ? "text-blue-400"
                          : "text-white/30 hover:text-white/60"
                      )
                    }
                  >
                    <item.icon className="w-4 h-4 mr-3 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
      
      <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#7000ff]/20 flex items-center justify-center border border-[#7000ff]/30">
            <User className="w-4 h-4 text-[#7000ff]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-white/40 truncate uppercase tracking-wider">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
