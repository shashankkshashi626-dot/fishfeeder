import React from "react";
import { Plus, X, Layers, Thermometer, AlertTriangle, Activity, Calendar, Battery, HelpCircle } from "lucide-react";

interface WidgetSelectorProps {
  onClose: () => void;
  onAddWidget: (type: string) => void;
  currentWidgets: Array<{ type: string }>;
}

export const WidgetSelector: React.FC<WidgetSelectorProps> = ({
  onClose,
  onAddWidget,
  currentWidgets,
}) => {
  // Config for all supported dashboard widgets
  const availableWidgets = [
    { type: "feed", name: "Interactive Feed Button", icon: <Plus className="w-5 h-5" />, desc: "Dispense food manually with animated states" },
    { type: "servo", name: "Feeder Servo Status", icon: <Activity className="w-5 h-5" />, desc: "Dispenser motor sweep and connection telemetry" },
    { type: "food", name: "Food Level Gauge", icon: <Layers className="w-5 h-5" />, desc: "Percentage of remaining food in storage" },
    { type: "temp", name: "Water Temperature", icon: <Thermometer className="w-5 h-5" />, desc: "DS18B20 real-time temperature tracking" },
    { type: "water_level", name: "Water Level Status", icon: <AlertTriangle className="w-5 h-5" />, desc: "Switches warning state when water runs low" },
    { type: "counter", name: "Daily Feed Counter", icon: <Activity className="w-5 h-5" />, desc: "Logs total count of daily feeds" },
    { type: "last_feed", name: "Last Feeding Timestamp", icon: <Calendar className="w-5 h-5" />, desc: "Track exact time fish were last fed" },
    { type: "battery", name: "Battery voltage", icon: <Battery className="w-5 h-5" />, desc: "Device hardware power source indicator" },
    { type: "custom", name: "Custom Sensor", icon: <HelpCircle className="w-5 h-5" />, desc: "Generic placeholder sensor for testing" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl space-y-5 animate-scale-up">
        
        <div className="flex justify-between items-center">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
            Add Dashboard Widget
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {availableWidgets.map((widget) => {
            const alreadyAdded = currentWidgets.some(w => w.type === widget.type);
            return (
              <button
                key={widget.type}
                onClick={() => {
                  if (!alreadyAdded) {
                    onAddWidget(widget.type);
                    onClose();
                  }
                }}
                disabled={alreadyAdded}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all ${
                  alreadyAdded 
                    ? "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 opacity-50 cursor-not-allowed" 
                    : "border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 hover:border-cyan-400/60 dark:hover:border-cyan-500/50 hover:bg-cyan-500/5 dark:hover:bg-cyan-500/5 hover:scale-[1.01]"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  alreadyAdded ? "bg-slate-200 dark:bg-slate-800 text-slate-400" : "bg-cyan-500/10 text-cyan-500"
                }`}>
                  {widget.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                    {widget.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal truncate">
                    {widget.desc}
                  </p>
                </div>
                {!alreadyAdded && (
                  <span className="text-[10px] font-extrabold text-cyan-500 shrink-0">
                    Add
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default WidgetSelector;
