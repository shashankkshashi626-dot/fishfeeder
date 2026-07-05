import React from 'react';
import { ListTodo, RefreshCw } from 'lucide-react';
import type { ActivityEvent } from '../hooks/useMQTT';

interface ActivityCardProps {
  activityLog: ActivityEvent[];
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activityLog }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/30 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 flex flex-col h-full min-h-[350px]">
      
      {/* Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 -mr-6 -mt-6 rounded-full blur-3xl opacity-10 bg-blue-500" />

      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Security Ledger</span>
          <h3 className="text-base font-bold text-slate-800 dark:text-white mt-0.5">Recent Activity</h3>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 text-blue-500">
          <ListTodo className="w-4.5 h-4.5" />
        </div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 scrollbar-thin">
        {activityLog.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin-slow text-slate-300 dark:text-slate-700" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">No Data Received</p>
              <p className="text-[10px] mt-0.5 font-medium leading-normal max-w-[200px]">Waiting for actual MQTT broker telemetry events...</p>
            </div>
          </div>
        ) : (
          <div className="relative pl-4 border-l border-slate-200 dark:border-slate-800 space-y-6">
            {activityLog.map((event) => (
              <div key={event.id} className="relative group transition-all duration-200">
                {/* Bullet */}
                <div className="absolute -left-[21.5px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-950 bg-cyan-500 shadow-md group-hover:scale-110 transition-transform duration-200" />
                
                {/* Event Details */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 select-none">
                      {event.time}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {event.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ActivityCard;
