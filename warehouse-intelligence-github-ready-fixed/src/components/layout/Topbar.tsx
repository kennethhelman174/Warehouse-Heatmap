import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../context/AuthContext';
import { Bell, UserCircle, LogOut, Info, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Topbar() {
  const { activeFacility } = useAppStore();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'warning', title: 'Congestion Alert', desc: 'High traffic detected in Aisle 4', time: '10 min ago' },
    { id: 2, type: 'info', title: 'Import Complete', desc: 'CAD structural data synchronized', time: '1 hour ago' },
  ]);

  const handleDismiss = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setNotifications([]);
  };

  return (
    <header className="h-20 glass-panel flex items-center justify-between px-6 shrink-0 relative z-20">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-white">
          {activeFacility?.name || 'No Facility Selected'}
        </h1>
        {activeFacility && (
          <span className="ml-4 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/20">
            {activeFacility.width}ft x {activeFacility.height}ft
          </span>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative" ref={dropdownRef}>
          <button 
            className="text-white/60 hover:text-white relative p-2"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7000ff] rounded-full shadow-[0_0_8px_rgba(112,0,255,0.8)]"></span>}
          </button>
          
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0a0a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 z-50">
              <div className="px-4 py-3 border-b border-white/10 bg-black/40 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Notifications <span className="ml-1 text-white/40 text-xs font-normal">({notifications.length})</span></h3>
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(notification.id);
                      }}
                      className="p-4 border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-full p-1.5 ${notification.type === 'warning' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {notification.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white group-hover:text-[#00d4ff] transition-colors flex justify-between">
                            {notification.title}
                          </p>
                          <p className="text-xs text-white/60 mt-0.5">{notification.desc}</p>
                          <p className="text-[10px] text-white/40 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-white/40 text-sm flex flex-col items-center">
                    <Bell className="w-8 h-8 mb-3 opacity-20" />
                    You're all caught up!
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t border-white/10 bg-black/40 text-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAllAsRead();
                    }}
                    className="text-xs text-[#00d4ff] hover:text-white transition-colors"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center pl-4 border-l border-white/10 gap-3">
          <div className="flex items-center text-right mr-1">
            <div className="mr-3">
              <div className="text-sm font-medium text-white">{user?.name}</div>
              <div className="text-xs text-white/60">{user?.role}</div>
            </div>
            <UserCircle className="w-8 h-8 text-white/60" />
          </div>
          <button onClick={handleLogout} className="text-white/60 hover:text-red-400 border-l border-white/10 pl-3">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
