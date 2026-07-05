import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Fish, Settings, User, Edit2, Check, RefreshCw } from 'lucide-react';

interface HeaderProps {
  espOnline: boolean | null;
  mqttConnected: boolean;
  onSettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ espOnline, mqttConnected, onSettingsClick }) => {
  const { user, updateAquariumName } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.aquariumName || 'My Aquarium');

  const handleSaveName = async () => {
    if (editName.trim()) {
      await updateAquariumName(editName.trim());
      setIsEditing(false);
    }
  };

  return (
    <header className="flex justify-between items-center py-4 px-6 border-b border-slate-200/60 dark:border-slate-800/40 backdrop-blur-xl sticky top-0 z-40 bg-white/70 dark:bg-slate-950/65 transition-colors duration-300">
      
      {/* Brand & Editable Aquarium Name */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25 shrink-0">
          <Fish className="w-5.5 h-5.5 text-white animate-pulse" />
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="px-2 py-0.5 text-sm font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md focus:outline-none focus:border-cyan-400 w-36"
                  autoFocus
                />
                <button onClick={handleSaveName} className="p-1 text-emerald-500 hover:text-emerald-600">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group">
                <h1 className="text-base font-extrabold text-slate-800 dark:text-white leading-none">
                  {user?.aquariumName || 'My Aquarium'}
                </h1>
                <button 
                  onClick={() => {
                    setEditName(user?.aquariumName || 'My Aquarium');
                    setIsEditing(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-cyan-400"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Online / Offline status badge */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider select-none ${
              espOnline 
                ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' 
                : 'bg-rose-500/10 text-rose-500 dark:text-rose-400 animate-pulse'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${espOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {espOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none mt-1">
            FishFeeder Pro Console
          </span>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-3">
        {/* MQTT Connection Status Indicator (compact) */}
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
          mqttConnected 
            ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' 
            : 'border-rose-500/30 text-rose-500 bg-rose-500/5 animate-pulse'
        }`}>
          <RefreshCw className={`w-3 h-3 ${mqttConnected ? '' : 'animate-spin'}`} />
          <span className="hidden sm:inline">MQTT:</span> {mqttConnected ? 'Connected' : 'Offline'}
        </span>

        {/* Settings Toggle */}
        <button
          onClick={onSettingsClick}
          className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
          aria-label="Settings"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>

        {/* Profile / Account Toggle */}
        <button
          onClick={onSettingsClick}
          className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:opacity-85 transition-opacity"
          aria-label="Account Profile"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-4.5 h-4.5 text-slate-400" />
          )}
        </button>
      </div>

    </header>
  );
};

export default Header;
