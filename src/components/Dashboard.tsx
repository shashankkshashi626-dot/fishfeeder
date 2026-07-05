import React from 'react';
import { FeedButton } from './FeedButton';
import { SensorCard } from './SensorCard';
import { ActivityCard } from './ActivityCard';
import { BluetoothSetupCard } from './BluetoothSetupCard';
import { Camera, Calendar, BarChart3, Scan, Lock } from 'lucide-react';
import { useMQTT } from '../hooks/useMQTT';

interface DashboardProps {
  mqttState: ReturnType<typeof useMQTT>;
}

export const Dashboard: React.FC<DashboardProps> = ({ mqttState }) => {
  const {
    mqttConnected,
    espOnline,
    servoStatus,
    lastFeedTime,
    feedCount,
    foodLevel,
    waterTemp,
    waterLevel,
    batteryVoltage,
    powerSource,
    activityLog,
    feedNow
  } = mqttState;

  return (
    <main className="flex-1 p-6 md:p-8 space-y-6 bg-slate-50/40 dark:bg-slate-950/20 transition-colors duration-300">
      
      {/* 1. Global Red Warning Banner (MQTT Disconnected) */}
      {!mqttConnected && (
        <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-md animate-pulse">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest leading-none">Broker Connection Offline</p>
              <p className="text-[10px] font-semibold mt-1 opacity-80 leading-normal">The dashboard has disconnected from HiveMQ. Feeding commands and telemetry updates are paused.</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Bluetooth Device Setup Card */}
      <BluetoothSetupCard />

      {/* 3. Action Control & Sensor Dashboard Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Feed Trigger Panel */}
        <div className="lg:col-span-5 h-full">
          <FeedButton 
            mqttConnected={mqttConnected} 
            espOnline={espOnline} 
            servoStatus={servoStatus} 
            onFeedClick={feedNow} 
          />
        </div>

        {/* Right Column: Sensor Metrics */}
        <div className="lg:col-span-7 h-full">
          <SensorCard 
            foodLevel={foodLevel} 
            waterTemp={waterTemp} 
            waterLevel={waterLevel} 
            batteryVoltage={batteryVoltage} 
            powerSource={powerSource} 
            espOnline={espOnline}
            feedCount={feedCount}
            lastFeedTime={lastFeedTime}
          />
        </div>
      </section>

      {/* 5. Activity Log and Future Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Activity Ledger Column */}
        <div className="lg:col-span-7">
          <ActivityCard activityLog={activityLog} />
        </div>

        {/* Future Expansion Coming Soon Column */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/30 p-6 backdrop-blur-xl shadow-xl flex-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span>Future Modules</span>
              <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Roadmap</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              
              {/* Camera */}
              <div className="p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center justify-center text-center gap-1.5 relative group opacity-60">
                <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                <Camera className="w-6 h-6 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Live Camera</span>
                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Coming Soon</span>
              </div>

              {/* Automatic Schedule */}
              <div className="p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center justify-center text-center gap-1.5 relative group opacity-60">
                <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                <Calendar className="w-6 h-6 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">AI Scheduler</span>
                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Coming Soon</span>
              </div>

              {/* AI Fish Detection */}
              <div className="p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center justify-center text-center gap-1.5 relative group opacity-60">
                <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                <Scan className="w-6 h-6 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Fish Biometrics</span>
                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Coming Soon</span>
              </div>

              {/* Feeding Analytics */}
              <div className="p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center justify-center text-center gap-1.5 relative group opacity-60">
                <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                <BarChart3 className="w-6 h-6 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Analytics Insights</span>
                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Coming Soon</span>
              </div>

            </div>
          </div>
        </div>
      </section>

    </main>
  );
};

export default Dashboard;
