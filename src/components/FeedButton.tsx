import React, { useState, useEffect } from 'react';
import { Fish, RotateCw, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

interface FeedButtonProps {
  mqttConnected: boolean;
  espOnline: boolean | null;
  servoStatus: 'Waiting' | 'Feeding' | 'Done' | 'Error' | null;
  onFeedClick: () => void;
}

export const FeedButton: React.FC<FeedButtonProps> = ({
  mqttConnected,
  espOnline,
  servoStatus,
  onFeedClick
}) => {
  const [progress, setProgress] = useState(0);
  const isFeeding = servoStatus === 'Feeding';
  const isOnline = espOnline === true && mqttConnected;

  // Handle feed progress bar simulation when feeding is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFeeding) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 100); // Takes ~2 seconds to complete
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isFeeding]);

  // Determine button state, text, and styles
  const getButtonState = () => {
    if (!mqttConnected) {
      return {
        disabled: true,
        text: 'MQTT Disconnected',
        colorClass: 'from-slate-400 to-slate-500 cursor-not-allowed opacity-60 shadow-none',
        icon: <AlertTriangle className="w-5 h-5" />
      };
    }
    if (espOnline !== true) {
      return {
        disabled: true,
        text: 'ESP32 Offline',
        colorClass: 'from-slate-400 to-slate-500 cursor-not-allowed opacity-60 shadow-none',
        icon: <AlertTriangle className="w-5 h-5" />
      };
    }
    if (isFeeding) {
      return {
        disabled: true,
        text: `Feeding... ${progress}%`,
        colorClass: 'from-amber-500 to-orange-600 shadow-amber-500/20 cursor-wait',
        icon: <RotateCw className="w-5 h-5 animate-spin" />
      };
    }
    if (servoStatus === 'Done') {
      return {
        disabled: false,
        text: 'Fed Successfully! Feed Again',
        colorClass: 'from-emerald-500 to-teal-600 shadow-emerald-500/30 hover:scale-[1.02] active:scale-98',
        icon: <Check className="w-5 h-5 animate-bounce" />
      };
    }
    if (servoStatus === 'Error') {
      return {
        disabled: false,
        text: 'System Error. Retry Feed',
        colorClass: 'from-rose-500 to-red-600 shadow-rose-500/30 hover:scale-[1.02] active:scale-98',
        icon: <AlertTriangle className="w-5 h-5" />
      };
    }

    // Default state: Ready
    return {
      disabled: false,
      text: 'Feed Fish Now',
      colorClass: 'from-cyan-500 to-blue-600 shadow-cyan-500/35 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98]',
      icon: <Fish className="w-5 h-5" />
    };
  };

  const btn = getButtonState();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/40 bg-gradient-to-br from-white/60 to-white/30 dark:from-slate-900/40 dark:to-slate-900/10 p-8 backdrop-blur-xl shadow-xl transition-all duration-300 flex flex-col items-center justify-center min-h-[300px]">
      
      {/* Decorative neon bubble rings */}
      <div className={`absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-10 transition-colors duration-500 ${
        isFeeding ? 'bg-amber-400' : isOnline ? 'bg-cyan-500' : 'bg-slate-500'
      }`} />
      
      {/* Fish Icon Area */}
      <div className="relative mb-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 border-dashed transition-all duration-500 ${
          isFeeding 
            ? 'border-amber-400/50 bg-amber-500/5 text-amber-500 scale-110 shadow-lg shadow-amber-500/10' 
            : isOnline 
              ? 'border-cyan-500/30 dark:border-cyan-500/20 bg-cyan-500/5 text-cyan-500' 
              : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'
        }`}>
          <Fish className={`w-12 h-12 transition-transform duration-300 ${
            isFeeding 
              ? 'animate-bounce scale-110 rotate-12' 
              : servoStatus === 'Done' 
                ? 'scale-105' 
                : 'hover:scale-105'
          }`} />
        </div>
        {/* Floating food crumbs animations while feeding */}
        {isFeeding && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="absolute w-2 h-2 rounded-full bg-amber-600/70 dark:bg-amber-400/80 animate-ping -translate-y-12 -translate-x-8" />
            <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-600/70 dark:bg-amber-400/80 animate-ping translate-y-12 translate-x-8" />
            <span className="absolute w-1 h-1 rounded-full bg-amber-600/70 dark:bg-amber-400/80 animate-ping translate-y-8 -translate-x-12" />
          </div>
        )}
      </div>

      {/* Button and Info Section */}
      <div className="w-full text-center space-y-4 max-w-sm">
        <button
          onClick={onFeedClick}
          disabled={btn.disabled}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-3 transition-all duration-300 bg-gradient-to-r ${btn.colorClass}`}
        >
          {btn.icon}
          <span className="tracking-wide uppercase text-sm">{btn.text}</span>
        </button>

        {/* Feeding Progress Bar */}
        {isFeeding && (
          <div className="w-full space-y-1.5">
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-100" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Dispensing Pellets...</span>
          </div>
        )}

        {/* Warning / Offline banners */}
        {!mqttConnected && (
          <p className="text-xs text-rose-500 font-semibold flex items-center justify-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 py-2.5 px-4 rounded-xl border border-rose-100 dark:border-rose-900/30">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Connection offline. Re-establishing MQTT server gateway...</span>
          </p>
        )}
        
        {mqttConnected && espOnline === false && (
          <p className="text-xs text-amber-500 font-semibold flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 py-2.5 px-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>MQTT Connected, Waiting for ESP32...</span>
          </p>
        )}

        {isOnline && !isFeeding && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Hardware system arm ready for dispense command.</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default FeedButton;
