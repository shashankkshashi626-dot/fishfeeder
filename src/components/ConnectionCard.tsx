import React from 'react';
import { Radio, AlertTriangle, ShieldCheck, ServerCrash } from 'lucide-react';

interface ConnectionCardProps {
  connected: boolean;
  error: string | null;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({ connected, error }) => {
  const brokerUrl = import.meta.env.VITE_MQTT_BROKER_URL || 'Not Configured';
  // Strip URL details for clean UI display
  const displayHost = brokerUrl.replace('wss://', '').replace(':8884/mqtt', '');

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/30 p-6 backdrop-blur-xl shadow-xl transition-all duration-300">
      {/* Background glow effects */}
      <div className={`absolute top-0 right-0 w-32 height-32 -mr-6 -mt-6 rounded-full blur-3xl opacity-10 transition-colors duration-500 ${
        connected ? 'bg-emerald-500' : 'bg-rose-500'
      }`} />

      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Network Gateway</span>
          <h3 className="text-base font-bold text-slate-800 dark:text-white mt-0.5">MQTT Broker</h3>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          connected ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-500'
        }`}>
          {connected ? <Radio className="w-4.5 h-4.5 animate-pulse" /> : <ServerCrash className="w-4.5 h-4.5" />}
        </div>
      </div>

      <div className="space-y-4">
        {/* Connection status Indicator */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50">
          <span className="text-xs text-slate-500 dark:text-slate-400">Connection status</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            connected 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Server Endpoint */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">HiveMQ Cloud Endpoint</span>
          <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 truncate" title={brokerUrl}>
            {displayHost}
          </span>
        </div>

        {/* Security protocol */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
          <span>SSL Secured Port 8884</span>
        </div>
      </div>

      {/* Error Output block */}
      {error && !connected && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-tight">{error}</span>
        </div>
      )}
    </div>
  );
};
export default ConnectionCard;
