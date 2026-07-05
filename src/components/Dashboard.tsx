import React from 'react';
import { ConnectionCard } from './ConnectionCard';
import { EspCard } from './EspCard';
import { ServoCard } from './ServoCard';
import { FeedButton } from './FeedButton';
import { SensorCard } from './SensorCard';
import { ActivityCard } from './ActivityCard';
import { Camera, Calendar, BarChart3, Scan, Lock, AlertOctagon, Settings2 } from 'lucide-react';
import { useMQTT } from '../hooks/useMQTT';
import { BluetoothSetupCard } from './BluetoothSetupCard';

interface DashboardProps {
  showSettings: boolean;
  onCloseSettings: () => void;
  mqttState: ReturnType<typeof useMQTT>;
}

export const Dashboard: React.FC<DashboardProps> = ({ showSettings, onCloseSettings, mqttState }) => {
  const {
    mqttConnected,
    mqttError,
    espOnline,
    wifiRssi,
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

  // Handle local overrides in LocalStorage
  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get('brokerUrl') as string;
    const user = formData.get('username') as string;
    const pass = formData.get('password') as string;

    if (url) localStorage.setItem('override_mqtt_url', url);
    if (user) localStorage.setItem('override_mqtt_user', user);
    if (pass) localStorage.setItem('override_mqtt_pass', pass);

    alert("MQTT Connection Configurations Saved. Reloading page to apply updates...");
    window.location.reload();
  };

  const handleClearSettings = () => {
    localStorage.removeItem('override_mqtt_url');
    localStorage.removeItem('override_mqtt_user');
    localStorage.removeItem('override_mqtt_pass');
    alert("Configurations Cleared. Restoring .env defaults. Reloading page...");
    window.location.reload();
  };

  // Get active broker configuration variables for placeholders
  const activeUrl = localStorage.getItem('override_mqtt_url') || import.meta.env.VITE_MQTT_BROKER_URL || '';
  const activeUser = localStorage.getItem('override_mqtt_user') || import.meta.env.VITE_MQTT_USERNAME || '';
  const activePass = localStorage.getItem('override_mqtt_pass') || import.meta.env.VITE_MQTT_PASSWORD || '';

  return (
    <main className="flex-1 p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/20 transition-colors duration-300">
      
      {/* 1. Global Red Warning Banner (MQTT Disconnected) */}
      {!mqttConnected && (
        <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/25 border-l-4 border-rose-500 text-rose-800 dark:text-rose-400 shadow-lg shadow-rose-500/5 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-5.5 h-5.5 text-rose-500 shrink-0" />
            <div>
              <p className="text-sm font-bold uppercase tracking-wider">Critical: Broker Connection Offline</p>
              <p className="text-xs font-semibold leading-normal opacity-85">The dashboard has disconnected from HiveMQ Cloud. Feed buttons and sensor polling are disabled.</p>
            </div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping mr-2" />
        </div>
      )}

      {/* 2. System Status Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ConnectionCard connected={mqttConnected} error={mqttError} />
        <EspCard espOnline={espOnline} rssi={wifiRssi} />
        <ServoCard status={servoStatus} lastFeedTime={lastFeedTime} feedCount={feedCount} espOnline={espOnline} />
      </section>

      {/* 3. Bluetooth Device Setup Card */}
      <BluetoothSetupCard />

      {/* 3. Action Control & Sensor Dashboard Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
          />
        </div>
      </section>

      {/* 4. Activity Log and Future Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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

      {/* 5. Connection Settings Modal Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 shadow-2xl space-y-6 animate-scale-up">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-cyan-500 animate-spin-slow" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white">MQTT Broker Gateway</h3>
              </div>
              <button 
                onClick={onCloseSettings}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-semibold p-1"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Broker URL (Secure WebSockets)</label>
                <input 
                  type="text" 
                  name="brokerUrl"
                  defaultValue={activeUrl}
                  placeholder="wss://xxxx.s1.eu.hivemq.cloud:8884/mqtt" 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-cyan-500 font-mono text-slate-700 dark:text-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client Username</label>
                  <input 
                    type="text" 
                    name="username"
                    defaultValue={activeUser}
                    placeholder="mqtt_username" 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-cyan-500 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client Password</label>
                  <input 
                    type="password" 
                    name="password"
                    defaultValue={activePass}
                    placeholder="••••••••" 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-cyan-500 text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal leading-relaxed">
                ℹ️ Overrides configured here are saved locally inside your browser cache (LocalStorage). If you clear cache or use another browser, default `.env` properties will apply.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  type="submit"
                  className="flex-1 py-3 px-5 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition-colors text-sm text-center"
                >
                  Save Configuration
                </button>
                <button 
                  type="button"
                  onClick={handleClearSettings}
                  className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-950 transition-colors text-sm text-center"
                >
                  Reset Defaults
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </main>
  );
};
export default Dashboard;
