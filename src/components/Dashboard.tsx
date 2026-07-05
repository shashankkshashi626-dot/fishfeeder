import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useMQTT } from "../hooks/useMQTT";
import { Plus, LayoutGrid, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Custom Widgets
import WidgetContainer from "./Widgets/WidgetContainer";
import ServoWidget from "./Widgets/ServoWidget";
import SensorWidget from "./Widgets/SensorWidget";
import FeedButton from "./FeedButton";
import WidgetSelector from "./WidgetSelector";
import { BluetoothSetupCard } from "./BluetoothSetupCard";

interface DashboardProps {
  mqttState: ReturnType<typeof useMQTT>;
}

export const Dashboard: React.FC<DashboardProps> = ({ mqttState }) => {
  const { user, updateLayout } = useAuth();
  const navigate = useNavigate();
  const [showSelector, setShowSelector] = useState(false);

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
    feedNow,
  } = mqttState;

  // Read layout from user profile, fall back to default if empty
  const widgets = user?.layout || [
    { id: "widget-feed", type: "feed", size: "lg" as const },
    { id: "widget-counter", type: "counter", size: "sm" as const },
    { id: "widget-temp", type: "temp", size: "sm" as const },
    { id: "widget-food", type: "food", size: "md" as const },
    { id: "widget-water", type: "water_level", size: "md" as const },
  ];

  // Helper: Save widgets state to Firestore / User record
  const saveLayout = async (newWidgets: typeof widgets) => {
    await updateLayout(newWidgets);
  };

  // Handler: Add new widget
  const handleAddWidget = (type: string) => {
    const id = `widget-${type}-${Date.now()}`;
    // Determine default size depending on widget type
    const size = (type === "feed" || type === "servo") ? "lg" as const : (type === "food" || type === "water_level") ? "md" as const : "sm" as const;
    const updated = [...widgets, { id, type, size }];
    saveLayout(updated);
  };

  // Handler: Delete widget
  const handleDeleteWidget = (id: string) => {
    const updated = widgets.filter(w => w.id !== id);
    saveLayout(updated);
  };

  // Handler: Resize widget
  const handleResizeWidget = (id: string) => {
    const updated = widgets.map(w => {
      if (w.id === id) {
        const nextSize = w.size === "sm" ? ("md" as const) : w.size === "md" ? ("lg" as const) : ("sm" as const);
        return { ...w, size: nextSize };
      }
      return w;
    });
    saveLayout(updated);
  };

  // Handler: Reorder widgets (move up/down)
  const handleMoveWidget = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const updated = [...widgets];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    saveLayout(updated);
  };

  return (
    <main className="flex-1 p-6 md:p-8 space-y-6 bg-slate-50/40 dark:bg-slate-950/20 transition-colors duration-300 relative min-h-screen">
      
      {/* Dynamic Sub Header */}
      <div className="flex justify-between items-center pb-2">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-cyan-400" />
            Control Dashboard
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-normal">
            Arrange, resize, and configure monitoring widgets for your aquarium.
          </p>
        </div>

        {/* Secondary Navigation Menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/auto-feed")}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold uppercase tracking-wider bg-gradient-to-tr from-cyan-400 to-blue-500 text-white rounded-xl shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Calendar className="w-4 h-4" /> Auto Feed
          </button>
        </div>
      </div>

      {/* Warning banner when MQTT server is disconnected */}
      {!mqttConnected && (
        <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-md">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <p className="text-xs font-bold uppercase tracking-wider leading-none">
              MQTT Disconnected · Automatic retry active...
            </p>
          </div>
        </div>
      )}

      {/* Bluetooth Device Setup Card */}
      <BluetoothSetupCard />

      {/* Grid of Draggable and Resizable Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map((widget, index) => {
          const title = 
            widget.type === "feed" ? "Interactive Feeding"
            : widget.type === "servo" ? "Dispenser Status"
            : widget.type === "food" ? "Food Levels"
            : widget.type === "temp" ? "Aquarium Temp"
            : widget.type === "water_level" ? "Water Sensors"
            : widget.type === "counter" ? "Telemetry Log"
            : widget.type === "last_feed" ? "Time Elapsed"
            : widget.type === "battery" ? "Power Supply"
            : "Metric Info";

          return (
            <WidgetContainer
              key={widget.id}
              id={widget.id}
              size={widget.size}
              type={widget.type}
              title={title}
              onDelete={() => handleDeleteWidget(widget.id)}
              onResize={() => handleResizeWidget(widget.id)}
              onMoveUp={index > 0 ? () => handleMoveWidget(index, "up") : undefined}
              onMoveDown={index < widgets.length - 1 ? () => handleMoveWidget(index, "down") : undefined}
            >
              {widget.type === "feed" && (
                <FeedButton
                  mqttConnected={mqttConnected}
                  espOnline={espOnline}
                  servoStatus={servoStatus}
                  onFeedClick={feedNow}
                />
              )}

              {widget.type === "servo" && (
                <ServoWidget
                  status={servoStatus}
                  espOnline={espOnline}
                />
              )}

              {widget.type !== "feed" && widget.type !== "servo" && (
                <SensorWidget
                  type={widget.type as any}
                  foodLevel={foodLevel}
                  waterTemp={waterTemp}
                  waterLevel={waterLevel}
                  feedCount={feedCount}
                  lastFeedTime={lastFeedTime}
                  batteryVoltage={batteryVoltage}
                  espOnline={espOnline}
                />
              )}
            </WidgetContainer>
          );
        })}
      </div>

      {/* Empty State Layout Placeholder */}
      {widgets.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl min-h-[300px]">
          <LayoutGrid className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">No active widgets</h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Tap the floating "+" button at the bottom right to start customizing your dashboard.
          </p>
        </div>
      )}

      {/* Floating Add Widget Action Button (FAB) */}
      <button
        onClick={() => setShowSelector(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white flex items-center justify-center shadow-xl shadow-cyan-500/25 active:scale-95 hover:scale-105 transition-all z-40 border border-cyan-300/20"
        aria-label="Add dashboard widget"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Add Widget Selector Overlay */}
      {showSelector && (
        <WidgetSelector
          onClose={() => setShowSelector(false)}
          onAddWidget={handleAddWidget}
          currentWidgets={widgets}
        />
      )}

    </main>
  );
};

export default Dashboard;
