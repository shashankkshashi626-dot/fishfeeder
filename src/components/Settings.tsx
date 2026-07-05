import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, Settings, Server, Sliders, User, LogOut, 
  Trash2, Moon, Sun, Loader2 
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { 
    user, logout, deleteAccount, updateProfileName, updateThresholds, 
    updateThemePref, updateAquariumName 
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<"connection" | "thresholds" | "account">("connection");

  // Connection fields state
  const [brokerUrl, setBrokerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Thresholds state
  const [foodLow, setFoodLow] = useState(20);
  const [waterLow, setWaterLow] = useState(30);
  const [tempHigh, setTempHigh] = useState(28);
  const [tempLow, setTempLow] = useState(18);

  // Account state
  const [displayName, setDisplayName] = useState("");
  const [aquariumName, setAquariumName] = useState("");
  
  // Loading & logs status
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  // Dicebear avatars seed list
  const avatars = [
    `https://api.dicebear.com/7.x/bottts/svg?seed=aqua`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=fish`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=coral`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=reef`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=bubble`,
  ];

  // Set initial states from user context
  useEffect(() => {
    if (user) {
      setFoodLow(user.thresholds?.foodLow || 20);
      setWaterLow(user.thresholds?.waterLow || 30);
      setTempHigh(user.thresholds?.tempHigh || 28);
      setTempLow(user.thresholds?.tempLow || 18);
      setDisplayName(user.displayName || "");
      setAquariumName(user.aquariumName || "My Aquarium");

      // Load overrides from LocalStorage or default VITE configs
      setBrokerUrl(localStorage.getItem('override_mqtt_url') || import.meta.env.VITE_MQTT_BROKER_URL || '');
      setUsername(localStorage.getItem('override_mqtt_user') || import.meta.env.VITE_MQTT_USERNAME || '');
      setPassword(localStorage.getItem('override_mqtt_pass') || import.meta.env.VITE_MQTT_PASSWORD || '');
    }

    // Scroll to section if hash tag is present
    if (location.hash === "#account") {
      setActiveTab("account");
    }
  }, [user, location.hash]);

  // Handler: Save Connection
  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (brokerUrl) localStorage.setItem('override_mqtt_url', brokerUrl);
      if (username) localStorage.setItem('override_mqtt_user', username);
      if (password) localStorage.setItem('override_mqtt_pass', password);
      
      showStatus("MQTT connection parameters saved successfully! Reconnecting...", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e: any) {
      showStatus(e.message || "Failed to save connection.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetConnection = () => {
    localStorage.removeItem('override_mqtt_url');
    localStorage.removeItem('override_mqtt_user');
    localStorage.removeItem('override_mqtt_pass');
    showStatus("Restored default connection settings! Reconnecting...", "success");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Handler: Save Thresholds
  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateThresholds({
        foodLow,
        waterLow,
        tempHigh,
        tempLow
      });
      showStatus("Alert thresholds updated successfully!", "success");
    } catch (e: any) {
      showStatus(e.message || "Failed to save thresholds.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetThresholds = () => {
    setFoodLow(20);
    setWaterLow(30);
    setTempHigh(28);
    setTempLow(18);
    showStatus("Threshold configurations reset to defaults.", "success");
  };

  // Handler: Save Profile Name & Aquarium Name
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (displayName.trim()) await updateProfileName(displayName.trim());
      if (aquariumName.trim()) await updateAquariumName(aquariumName.trim());
      showStatus("Account profile details updated successfully!", "success");
    } catch (e: any) {
      showStatus(e.message || "Failed to save account details.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Handler: Logout
  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await logout();
      navigate("/login");
    }
  };

  // Handler: Delete Account
  const handleDeleteAccount = async () => {
    if (confirm("🚨 WARNING: This will permanently delete your account and all associated dashboard layout files. This action CANNOT be undone. Proceed?")) {
      try {
        await deleteAccount();
        navigate("/login");
      } catch (e: any) {
        showStatus(e.message || "Delete account failed. Re-authenticate and try again.", "error");
      }
    }
  };

  // Helper status alert trigger
  const showStatus = (msg: string, type: "success" | "error") => {
    setStatusMsg(msg);
    setStatusType(type);
    setTimeout(() => setStatusMsg(""), 4000);
  };

  return (
    <main className="flex-1 p-6 md:p-8 space-y-6 bg-slate-50/40 dark:bg-slate-950/20 transition-colors duration-300 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/dashboard")} className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            Console Settings
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-none mt-1">
            Manage your IoT device, telemetry alerts, and profile preferences
          </p>
        </div>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-bold ${
          statusType === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        }`}>
          {statusMsg}
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar List */}
        <div className="w-full md:w-64 space-y-2 shrink-0">
          <button
            onClick={() => setActiveTab("connection")}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left text-xs font-extrabold uppercase tracking-wider transition-all ${
              activeTab === "connection"
                ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/25 scale-[1.01]"
                : "border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <Server className="w-4 h-4" /> Connection Configuration
          </button>
          
          <button
            onClick={() => setActiveTab("thresholds")}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left text-xs font-extrabold uppercase tracking-wider transition-all ${
              activeTab === "thresholds"
                ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/25 scale-[1.01]"
                : "border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <Sliders className="w-4 h-4" /> Alarm Thresholds
          </button>
          
          <button
            onClick={() => setActiveTab("account")}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left text-xs font-extrabold uppercase tracking-wider transition-all ${
              activeTab === "account"
                ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/25 scale-[1.01]"
                : "border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <User className="w-4 h-4" /> User Account
          </button>
        </div>

        {/* Configurations Details Container Area */}
        <div className="flex-1 rounded-3xl border border-slate-200/80 dark:border-slate-800/40 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 shadow-xl">
          
          {/* Tab 1: Connection */}
          {activeTab === "connection" && (
            <form onSubmit={handleSaveConnection} className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">MQTT broker Configuration</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                  Configure secure connection strings to bind telemetry values.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Broker URL</label>
                  <input
                    type="text"
                    value={brokerUrl}
                    onChange={(e) => setBrokerUrl(e.target.value)}
                    placeholder="wss://xxxx.hivemq.cloud:8884/mqtt"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-cyan-400 font-mono text-slate-700 dark:text-slate-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="mqtt_username"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-cyan-400 text-slate-700 dark:text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-cyan-400 text-slate-700 dark:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Connection"}
                </button>
                <button
                  type="button"
                  onClick={handleResetConnection}
                  className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-950 transition-colors"
                >
                  Reset Defaults
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Thresholds */}
          {activeTab === "thresholds" && (
            <form onSubmit={handleSaveThresholds} className="space-y-5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Sensor Warning Thresholds</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                  Define high / low warning levels to trigger automated push notifications.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Food level */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-400">
                    <span>Food Low Level</span>
                    <span className="text-cyan-400">{foodLow}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={foodLow}
                    onChange={(e) => setFoodLow(parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                {/* Water Level */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-400">
                    <span>Water Low Level</span>
                    <span className="text-cyan-400">{waterLow}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={waterLow}
                    onChange={(e) => setWaterLow(parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                {/* Temperature High */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-400">
                    <span>High Temp Alarm</span>
                    <span className="text-rose-400">{tempHigh}°C</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="35"
                    value={tempHigh}
                    onChange={(e) => setTempHigh(parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                {/* Temperature Low */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-400">
                    <span>Low Temp Alarm</span>
                    <span className="text-cyan-400">{tempLow}°C</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="22"
                    value={tempLow}
                    onChange={(e) => setTempLow(parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Thresholds"}
                </button>
                <button
                  type="button"
                  onClick={handleResetThresholds}
                  className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-950 transition-colors"
                >
                  Reset Defaults
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Account */}
          {activeTab === "account" && (
            <div className="space-y-6">
              
              {/* Profile Details */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Profile Details</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                    Update profile credentials and personalized labels
                  </p>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <img src={user?.photoURL || avatars[0]} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-800" />
                  <div>
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-widest mb-1">Avatar</span>
                    <span className="text-xs text-slate-500 font-bold">Auto-generated via user unique identifier</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Your Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-cyan-400 text-slate-700 dark:text-slate-300"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Aquarium Name</label>
                    <input
                      type="text"
                      value={aquariumName}
                      onChange={(e) => setAquariumName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-cyan-400 text-slate-700 dark:text-slate-300"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="py-3 px-5 rounded-xl bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile Details"}
                </button>
              </form>

              {/* Theme Settings Panel */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50 space-y-3">
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Visual Interface Theme</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
                    Customize the active layout theme of the mobile app.
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={async () => {
                      await updateThemePref("light");
                      showStatus("Theme updated to Light Mode", "success");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border text-xs font-extrabold uppercase tracking-wider transition-all ${
                      user?.theme === "light"
                        ? "border-cyan-500 bg-cyan-500/5 text-cyan-500"
                        : "border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-slate-500"
                    }`}
                  >
                    <Sun className="w-4 h-4" /> Light Theme
                  </button>
                  
                  <button
                    onClick={async () => {
                      await updateThemePref("dark");
                      showStatus("Theme updated to Dark Mode", "success");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border text-xs font-extrabold uppercase tracking-wider transition-all ${
                      user?.theme === "dark"
                        ? "border-cyan-500 bg-cyan-500/5 text-cyan-500"
                        : "border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-slate-500"
                    }`}
                  >
                    <Moon className="w-4 h-4" /> Dark Theme
                  </button>
                </div>
              </div>

              {/* Dangerous Operations (Logout, Delete) */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-3 px-5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
                
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="py-3 px-5 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-rose-500/20"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

    </main>
  );
};

export default SettingsPage;
