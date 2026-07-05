import React from "react";
import { 
  Thermometer, Layers, Calendar, 
  Battery, AlertTriangle, HelpCircle, Activity 
} from "lucide-react";

interface SensorWidgetProps {
  type: "food" | "temp" | "water_level" | "counter" | "last_feed" | "battery" | "custom";
  foodLevel: number | null;
  waterTemp: number | null;
  waterLevel: "Normal" | "Low" | null;
  feedCount: number | null;
  lastFeedTime: string | null;
  batteryVoltage: number | null;
  espOnline: boolean | null;
}

export const SensorWidget: React.FC<SensorWidgetProps> = ({
  type,
  foodLevel,
  waterTemp,
  waterLevel,
  feedCount,
  lastFeedTime,
  batteryVoltage,
  espOnline,
}) => {
  const getOfflinePlaceholder = (label: string) => {
    return (
      <div className="flex items-center gap-3 opacity-60">
        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-bold uppercase">{label}</p>
          <p className="text-sm font-black text-slate-500">Offline</p>
        </div>
      </div>
    );
  };

  if (!espOnline && type !== "last_feed" && type !== "counter") {
    // Keep offline indicators for real-time sensors
    return getOfflinePlaceholder(
      type === "food" ? "Food Level" 
      : type === "temp" ? "Water Temp" 
      : type === "water_level" ? "Water Level"
      : type === "battery" ? "Battery"
      : "Sensor"
    );
  }

  switch (type) {
    case "food": {
      const food = foodLevel !== null ? foodLevel : 0;
      const isAlert = food < 20;
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isAlert ? "bg-rose-500/15" : "bg-cyan-500/10"
            }`}>
              <Layers className={`w-6 h-6 ${isAlert ? "text-rose-400" : "text-cyan-400"}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Food Storage</p>
              <p className={`text-xl font-black ${isAlert ? "text-rose-400 animate-pulse" : "text-slate-800 dark:text-white"}`}>
                {food}%
              </p>
            </div>
          </div>
          <div className="w-16 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isAlert ? "bg-rose-500" : "bg-cyan-400"}`}
              style={{ width: `${food}%` }}
            />
          </div>
        </div>
      );
    }

    case "temp": {
      const temp = waterTemp !== null ? waterTemp : 0;
      const isHigh = temp > 28;
      const isLow = temp < 18;
      return (
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isHigh || isLow ? "bg-rose-500/15" : "bg-emerald-500/10"
          }`}>
            <Thermometer className={`w-6 h-6 ${isHigh || isLow ? "text-rose-400 animate-pulse" : "text-emerald-400"}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Water Temp</p>
            <p className="text-xl font-black text-slate-800 dark:text-white flex items-baseline">
              {temp.toFixed(1)}<span className="text-sm font-semibold text-slate-400 ml-0.5">°C</span>
            </p>
            {(isHigh || isLow) && (
              <span className="text-[9px] font-extrabold uppercase text-rose-400 leading-none">
                {isHigh ? "High Temp Alarm" : "Low Temp Alarm"}
              </span>
            )}
          </div>
        </div>
      );
    }

    case "water_level": {
      const isLow = waterLevel === "Low";
      return (
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isLow ? "bg-rose-500/15" : "bg-blue-500/10"
          }`}>
            <AlertTriangle className={`w-6 h-6 ${isLow ? "text-rose-400 animate-pulse" : "text-blue-400"}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Water Level</p>
            <p className={`text-xl font-black ${isLow ? "text-rose-400" : "text-slate-800 dark:text-white"}`}>
              {isLow ? "CRITICAL LOW" : "Normal"}
            </p>
          </div>
        </div>
      );
    }

    case "counter": {
      const count = feedCount !== null ? feedCount : 0;
      return (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Daily Feed Cycles</p>
            <p className="text-xl font-black text-slate-800 dark:text-white">
              {count} <span className="text-xs font-semibold text-slate-400">times</span>
            </p>
          </div>
        </div>
      );
    }

    case "last_feed": {
      const time = lastFeedTime || "No Data";
      return (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Last Feeding</p>
            <p className="text-base font-extrabold text-slate-800 dark:text-white">
              {time}
            </p>
          </div>
        </div>
      );
    }

    case "battery": {
      const volts = batteryVoltage !== null ? batteryVoltage : 0;
      const isCritical = volts < 3.4;
      return (
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isCritical ? "bg-rose-500/15" : "bg-yellow-500/10"
          }`}>
            <Battery className={`w-6 h-6 ${isCritical ? "text-rose-400 animate-pulse" : "text-yellow-500"}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Battery Voltage</p>
            <p className={`text-xl font-black ${isCritical ? "text-rose-400" : "text-slate-800 dark:text-white"}`}>
              {volts.toFixed(2)}<span className="text-xs font-semibold text-slate-400 ml-0.5">V</span>
            </p>
          </div>
        </div>
      );
    }

    case "custom":
    default:
      return (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-500/10 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Custom Metric</p>
            <p className="text-base font-extrabold text-slate-600 dark:text-slate-300">
              Add-on module ready
            </p>
          </div>
        </div>
      );
  }
};

export default SensorWidget;
