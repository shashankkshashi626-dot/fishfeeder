import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  X, Server, Sliders, User, LogOut, 
  Trash2, Loader2 
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, logout, deleteAccount, updateProfileName, updateThresholds, 
    updateAquariumName 
  } = useAuth();
  const navigate = useNavigate();

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

  const avatars = [
    `https://api.dicebear.com/7.x/bottts/svg?seed=aqua`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=fish`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=coral`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=reef`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=bubble`,
  ];

  // Set initial states from user context
  useEffect(() => {
    if (user && isOpen) {
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
  }, [user, isOpen]);

  if (!isOpen) return null;

  // Helper status alert trigger
  const showStatus = (msg: string, type: "success" | "error") => {
    setStatusMsg(msg);
    setStatusType(type);
    setTimeout(() => setStatusMsg(""), 4000);
  };

  // Handler: Save Connection
  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (brokerUrl) localStorage.setItem('override_mqtt_url', brokerUrl);
      if (username) localStorage.setItem('override_mqtt_user', username);
      if (password) localStorage.setItem('override_mqtt_pass', password);
      
      showStatus("MQTT connection parameters saved! Reconnecting...", "success");
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
      onClose();
      await logout();
      navigate("/login");
    }
  };

  // Handler: Delete Account
  const handleDeleteAccount = async () => {
    if (confirm("🚨 WARNING: This will permanently delete your account and all associated configuration files. This action CANNOT be undone. Proceed?")) {
      try {
        onClose();
        await deleteAccount();
        navigate("/login");
      } catch (e: any) {
        showStatus(e.message || "Delete account failed. Re-authenticate and try again.", "error");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-white select-none">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-5 pr-8">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            Console Configuration Gateway
          </h3>
          <p className="text-xs text-slate-400 leading-normal mt-1">
            Configure your secure MQTT server and personal alerting thresholds
          </p>
        </div>

        {/* Status banner */}
        {statusMsg && (
          <div className={`mb-4 p-3.5 rounded-2xl border text-xs font-bold ${
            statusType === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse" 
              : "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse"
          }`}>
            {statusMsg}
          </div>
        )}

        {/* Modal Main body (flex row) */}
        <div className="flex-1 flex flex-col md:flex-row gap-5 min-h-0 overflow-y-auto pr-1">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-56 space-y-2 shrink-0">
            <button
              onClick={() => setActiveTab("connection")}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl border text-left text-[11px] font-extrabold uppercase tracking-wider transition-all ${
                activeTab === "connection"
                  ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/25"
                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <Server className="w-3.5 h-3.5" /> Broker Gateway
            </button>
            
            <button
              onClick={() => setActiveTab("thresholds")}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl border text-left text-[11px] font-extrabold uppercase tracking-wider transition-all ${
                activeTab === "thresholds"
                  ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/25"
                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Alert Settings
            </button>
            
            <button
              onClick={() => setActiveTab("account")}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl border text-left text-[11px] font-extrabold uppercase tracking-wider transition-all ${
                activeTab === "account"
                  ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/25"
                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" /> User Account
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 border border-slate-800 bg-slate-950/30 rounded-2xl p-5 overflow-y-auto">
            
            {/* Tab 1: Connection */}
            {activeTab === "connection" && (
              <form onSubmit={handleSaveConnection} className="space-y-4">
                <div>
                  <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest">MQTT Server URL</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                    Browser uses Secure WebSockets (wss://) to connect to HiveMQ Cloud.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Broker URL</label>
                    <input
                      type="text"
                      value={brokerUrl}
                      onChange={(e) => setBrokerUrl(e.target.value)}
                      placeholder="wss://xxxx.hivemq.cloud:8884/mqtt"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:outline-none focus:border-cyan-400 font-mono text-slate-100 placeholder:text-slate-600"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="mqtt_username"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:outline-none focus:border-cyan-400 text-slate-100 placeholder:text-slate-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:outline-none focus:border-cyan-400 text-slate-100 placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[9px] text-slate-400 leading-normal leading-relaxed italic border-t border-slate-800/50 pt-2">
                  * Note: Overrides are saved locally inside your device web storage. Default settings apply on new browsers.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/20"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Settings"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetConnection}
                    className="py-3 px-4 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Reset Defaults
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Thresholds */}
            {activeTab === "thresholds" && (
              <form onSubmit={handleSaveThresholds} className="space-y-4">
                <div>
                  <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest">Sensor Warnings</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                    Define warning levels to trigger local device push notifications.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-extrabold uppercase text-slate-400">
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

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-extrabold uppercase text-slate-400">
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

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-extrabold uppercase text-slate-400">
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

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-extrabold uppercase text-slate-400">
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

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/50">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/20"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Thresholds"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetThresholds}
                    className="py-3 px-4 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Reset Defaults
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Account */}
            {activeTab === "account" && (
              <div className="space-y-5">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest">Profile Details</h4>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                      Update your account name and aquarium console label.
                  </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <img 
                      src={user?.photoURL || avatars[0]} 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-xl object-cover border border-slate-800" 
                    />
                    <div>
                      <span className="text-[9px] font-extrabold uppercase text-slate-500 block tracking-widest">Avatar Choice</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Identicon loaded from email hash</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Your Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:outline-none focus:border-cyan-400 text-slate-100 placeholder:text-slate-600"
                        required
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Aquarium Name</label>
                      <input
                        type="text"
                        value={aquariumName}
                        onChange={(e) => setAquariumName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:outline-none focus:border-cyan-400 text-slate-100 placeholder:text-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="py-3 px-4 rounded-xl bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/20"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Profile Details"}
                  </button>
                </form>

                {/* Account Actions */}
                <div className="pt-4 border-t border-slate-800/50 space-y-3">
                  <div className="flex justify-between items-center bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                    <div>
                      <h5 className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wide">Sign Out Session</h5>
                      <p className="text-[9px] text-slate-400 mt-0.5">Disconnects session authorization from memory.</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                  </div>

                  <div className="flex justify-between items-center bg-rose-500/5 p-3.5 rounded-xl border border-rose-950/30">
                    <div>
                      <h5 className="text-[11px] font-extrabold text-rose-400 uppercase tracking-wide">Delete Account</h5>
                      <p className="text-[9px] text-slate-400 mt-0.5">Erases cloud records permanently.</p>
                    </div>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-400 flex items-center gap-1.5 border border-rose-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
