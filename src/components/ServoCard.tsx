import React from 'react';
import { Settings, Clock, Calculator, Loader2 } from 'lucide-react';

interface ServoCardProps {
  status: 'Waiting' | 'Feeding' | 'Done' | 'Error' | null;
  lastFeedTime: string | null;
  feedCount: number | null;
  espOnline: boolean | null;
}

export const ServoCard: React.FC<ServoCardProps> = ({ status, lastFeedTime, feedCount, espOnline }) => {
  const isOnline = espOnline === true;
  
  // Custom status stylings
  const getStatusConfig = (val: typeof status) => {
    if (!isOnline) return { text: 'ESP32 Offline', bg: 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 border-rose-100 dark:border-rose-900/20' };
    if (val === null) return { text: 'Waiting for Data...', bg: 'bg-slate-50 dark:bg-slate-900/30 text-slate-400 border-slate-100 dark:border-slate-800/30' };
    
    switch (val) {
      case 'Feeding':
        return { text: 'Feeding Active', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/30 dark:border-amber-900/20 animate-pulse' };
      case 'Done':
        return { text: 'Dispense Completed', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/30 dark:border-emerald-900/20' };
      case 'Error':
        return { text: 'Mechanical Error', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/30 dark:border-rose-900/20' };
      case 'Waiting':
      default:
        return { text: 'Ready/Waiting', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/50 dark:border-slate-700/50' };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/30 p-6 backdrop-blur-xl shadow-xl transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 -mr-6 -mt-6 rounded-full blur-3xl opacity-10 bg-indigo-500" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Dispenser System</span>
          <h3 className="text-base font-bold text-slate-800 dark:text-white mt-0.5">Servo Mechanism</h3>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500">
          <Settings className={`w-4.5 h-4.5 ${status === 'Feeding' ? 'animate-spin-slow' : ''}`} />
        </div>
      </div>

      <div className="space-y-4">
        {/* Servo Status Indicator */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">Mechanism State</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig.bg}`}>
            {status === 'Feeding' && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
            {statusConfig.text}
          </span>
        </div>

        {/* Feed Counter */}
        <div className="flex items-center justify-between py-2 border-b border-t border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Today's Feed Count</span>
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {feedCount !== null ? `${feedCount} times` : 'Waiting for Data...'}
          </span>
        </div>

        {/* Last Feed Time */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Last Dispense Time</span>
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
            {lastFeedTime !== null ? lastFeedTime : 'Waiting for Data...'}
          </span>
        </div>
      </div>
    </div>
  );
};
export default ServoCard;
