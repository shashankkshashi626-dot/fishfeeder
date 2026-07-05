import React, { useState, useEffect } from 'react';
import { Sun, Moon, Settings, Fish } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onSettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode, onSettingsClick }) => {
  const [time, setTime] = useState<string>('');

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center py-5 px-6 border-b border-slate-200 dark:border-slate-800/50 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300 bg-white/70 dark:bg-slate-950/70">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3 mb-4 sm:mb-0">
        <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 dark:shadow-cyan-500/10">
          <Fish className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-cyan-100 bg-clip-text text-transparent">
            FishFeeder <span className="text-cyan-500 text-sm font-semibold align-super">v2.0</span>
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase">Commercial IoT Console</p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-4">
        {/* Clock */}
        <div className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono tracking-wider tabular-nums">
          {time || 'Initializing...'}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95 transition-all duration-200"
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-cyan-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Settings Trigger */}
        <button
          onClick={onSettingsClick}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 active:rotate-45 active:scale-95 transition-all duration-300"
          aria-label="Configure MQTT"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
export default Header;
