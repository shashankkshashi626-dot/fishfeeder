import React from 'react';
import { Cpu, Wifi, WifiOff } from 'lucide-react';

interface EspCardProps {
  espOnline: boolean | null;
  rssi: number | null;
}

export const EspCard: React.FC<EspCardProps> = ({ espOnline, rssi }) => {
  // Determine connection status text and badge styles
  const isOnline = espOnline === true;
  const statusLabel = espOnline === null ? 'Waiting for ESP32...' : isOnline ? 'Online' : 'Offline';
  
  // Calculate signal quality representation
  const getSignalStrength = (val: number | null) => {
    if (val === null) return { text: 'Waiting for Data...', color: 'text-slate-400' };
    if (val >= -55) return { text: `📶 ${val} dBm (Excellent)`, color: 'text-emerald-500' };
    if (val >= -70) return { text: `📶 ${val} dBm (Good)`, color: 'text-amber-500' };
    return { text: `📶 ${val} dBm (Weak)`, color: 'text-rose-500' };
  };

  const signal = getSignalStrength(rssi);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/30 p-6 backdrop-blur-xl shadow-xl transition-all duration-300">
      {/* Background glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-6 -mt-6 rounded-full blur-3xl opacity-10 transition-colors duration-500 ${
        isOnline ? 'bg-cyan-500' : 'bg-rose-500'
      }`} />

      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Micro-Controller</span>
          <h3 className="text-base font-bold text-slate-800 dark:text-white mt-0.5">ESP32 Device</h3>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isOnline ? 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-500' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-500'
        }`}>
          {isOnline ? <Cpu className="w-4.5 h-4.5" /> : <Cpu className="w-4.5 h-4.5 text-rose-500 animate-pulse" />}
        </div>
      </div>

      <div className="space-y-4">
        {/* Device Status */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50">
          <span className="text-xs text-slate-500 dark:text-slate-400">System State</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            isOnline 
              ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400' 
              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-cyan-500 animate-ping' : 'bg-rose-500'}`} />
            {statusLabel}
          </span>
        </div>

        {/* WiFi RSSI Signal Strength */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">Wireless RSSI Signal</span>
          <div className="flex items-center gap-2">
            {rssi !== null ? (
              isOnline ? (
                <Wifi className={`w-4 h-4 ${signal.color}`} />
              ) : (
                <WifiOff className="w-4 h-4 text-rose-500" />
              )
            ) : null}
            <span className={`text-sm font-semibold font-mono tracking-tight ${isOnline ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
              {isOnline ? signal.text : 'Waiting for ESP32...'}
            </span>
          </div>
        </div>

        {/* Dynamic connection indicator */}
        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          {isOnline ? 'Broadcasting telemetry on telemetry/status' : 'Heartbeat connection offline'}
        </div>
      </div>
    </div>
  );
};
export default EspCard;
