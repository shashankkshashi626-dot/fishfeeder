import React from 'react';
import { Thermometer, Droplets, Battery, Zap, Package, Sparkles, Calendar, Clock } from 'lucide-react';

interface SensorCardProps {
  foodLevel: number | null;
  waterTemp: number | null;
  waterLevel: 'Normal' | 'Low' | null;
  batteryVoltage: number | null;
  powerSource: 'Battery' | 'USB' | 'DC Adapter' | null;
  espOnline: boolean | null;
  feedCount: number | null;
  lastFeedTime: string | null;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  foodLevel,
  waterTemp,
  waterLevel,
  batteryVoltage,
  powerSource,
  espOnline,
  feedCount,
  lastFeedTime
}) => {
  const isOnline = espOnline === true;

  // Render a parameter cell or "Waiting for Data..." if null
  const renderValue = (
    val: any,
    unit: string = '',
    customStyle: string = 'text-slate-800 dark:text-white'
  ) => {
    if (!isOnline) {
      return <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Waiting for ESP32...</span>;
    }
    if (val === null || val === undefined) {
      return <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 animate-pulse">Waiting for Data...</span>;
    }
    return <span className={`text-xl font-bold font-mono tracking-tight ${customStyle}`}>{val}{unit}</span>;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/30 p-6 backdrop-blur-xl shadow-xl transition-all duration-300">
      
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-32 h-32 -mr-6 -mt-6 rounded-full blur-3xl opacity-10 bg-cyan-500" />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tank Analytics</span>
          <h3 className="text-base font-bold text-slate-800 dark:text-white mt-0.5">Telemetry & Sensors</h3>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-50 dark:bg-cyan-950/30 text-cyan-500">
          <Sparkles className="w-4.5 h-4.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Food Level Progress Bar */}
        <div className="col-span-1 md:col-span-2 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/20 dark:bg-slate-950/20 backdrop-blur-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Package className="w-4 h-4 text-cyan-500" />
              <span className="text-xs font-bold uppercase tracking-wider">Feed Storage Level</span>
            </div>
            {isOnline && foodLevel !== null ? (
              <span className={`text-xs font-extrabold ${foodLevel < 20 ? 'text-rose-500' : 'text-cyan-500'}`}>
                {foodLevel}%
              </span>
            ) : null}
          </div>
          
          <div className="w-full">
            {isOnline && foodLevel !== null ? (
              <div className="space-y-2">
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                      foodLevel < 20 
                        ? 'from-rose-400 to-red-600' 
                        : foodLevel < 50 
                          ? 'from-amber-400 to-amber-500' 
                          : 'from-cyan-400 to-blue-500'
                    }`} 
                    style={{ width: `${foodLevel}%` }}
                  />
                </div>
                {foodLevel < 20 && (
                  <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Storage Warning: Low Pellets</span>
                )}
              </div>
            ) : (
              <div className="text-slate-400 dark:text-slate-500 text-xs font-semibold py-1">
                {isOnline ? 'No Data Received' : 'Waiting for ESP32...'}
              </div>
            )}
          </div>
        </div>

        {/* Daily Feedings (New) */}
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/20 dark:bg-slate-950/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Feeds Today</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            {renderValue(feedCount, ' times')}
          </div>
        </div>

        {/* Last Feeding Time (New) */}
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/20 dark:bg-slate-950/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Last Feed</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            {isOnline ? (
              <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                {lastFeedTime || 'No Data'}
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Waiting for ESP32...</span>
            )}
          </div>
        </div>

        {/* Water Temperature */}
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/20 dark:bg-slate-950/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Thermometer className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Water Temp</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            {renderValue(waterTemp, ' °C', 'text-slate-800 dark:text-white')}
          </div>
        </div>

        {/* Water Level Sensor */}
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/20 dark:bg-slate-950/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Water Level</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            {renderValue(
              waterLevel, 
              '', 
              waterLevel === 'Low' ? 'text-rose-500' : 'text-emerald-500'
            )}
          </div>
        </div>

        {/* Battery Voltage */}
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/20 dark:bg-slate-950/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Battery className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Battery Volt</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            {renderValue(batteryVoltage, ' V')}
          </div>
        </div>

        {/* Power Source */}
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/20 dark:bg-slate-950/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Power Source</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            {renderValue(powerSource)}
          </div>
        </div>

      </div>
    </div>
  );
};
export default SensorCard;
