import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fish, Check, AlertTriangle, RefreshCw } from 'lucide-react';

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
      }, 100);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isFeeding]);

  // Determine styles & animations for states
  const getButtonConfig = () => {
    if (!isOnline) {
      return {
        disabled: true,
        bgClass: "from-slate-700/50 to-slate-800/50 border-slate-700/40 text-slate-500",
        shadow: "shadow-none",
        icon: <AlertTriangle className="w-8 h-8" />,
        text: "Offline",
      };
    }
    if (isFeeding) {
      return {
        disabled: true,
        bgClass: "from-cyan-500/20 to-blue-500/20 border-cyan-400/50 text-cyan-400",
        shadow: "shadow-lg shadow-cyan-500/10",
        icon: <RefreshCw className="w-8 h-8 animate-spin" />,
        text: "Feeding",
      };
    }
    if (servoStatus === 'Done') {
      return {
        disabled: false,
        bgClass: "from-emerald-500/25 to-teal-500/25 border-emerald-400/50 text-emerald-400",
        shadow: "shadow-xl shadow-emerald-500/20",
        icon: <Check className="w-8 h-8 animate-bounce" />,
        text: "Success",
      };
    }
    if (servoStatus === 'Error') {
      return {
        disabled: false,
        bgClass: "from-rose-500/25 to-red-500/25 border-rose-400/50 text-rose-400",
        shadow: "shadow-xl shadow-rose-500/20",
        icon: <AlertTriangle className="w-8 h-8 animate-pulse" />,
        text: "Retry",
      };
    }

    // Default: Ready state
    return {
      disabled: false,
      bgClass: "from-cyan-500 to-blue-600 border-cyan-400/35 text-white hover:from-cyan-400 hover:to-blue-500",
      shadow: "shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-400/40",
      icon: <Fish className="w-8 h-8" />,
      text: "Feed Now",
    };
  };

  const config = getButtonConfig();

  return (
    <div className="flex flex-col items-center justify-center p-6 h-full select-none">
      
      {/* Premium Circular Feed Button Wrapper */}
      <div className="relative flex items-center justify-center">
        
        {/* Animated Ripple Effects */}
        {isFeeding && (
          <>
            <motion.div
              animate={{ scale: [1, 2], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
              className="absolute w-36 h-36 rounded-full bg-cyan-400/20 border border-cyan-400/30"
            />
            <motion.div
              animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.5 }}
              className="absolute w-36 h-36 rounded-full bg-cyan-400/10 border border-cyan-400/20"
            />
          </>
        )}

        {/* Success Pulsing Ring */}
        {servoStatus === 'Done' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute w-36 h-36 rounded-full bg-emerald-400/20 border border-emerald-400/30"
          />
        )}

        {/* Main Interactive Circle */}
        <motion.button
          whileHover={config.disabled ? {} : { scale: 1.05 }}
          whileTap={config.disabled ? {} : { scale: 0.95 }}
          onClick={onFeedClick}
          disabled={config.disabled}
          className={`w-36 h-36 rounded-full bg-gradient-to-tr ${config.bgClass} ${config.shadow} border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 z-10`}
        >
          {config.icon}
          <span className="text-[10px] font-extrabold tracking-widest uppercase opacity-90">
            {config.text}
          </span>
        </motion.button>
      </div>

      {/* Progress Bar (while active) */}
      <AnimatePresence>
        {isFeeding && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full max-w-[200px] mt-4 space-y-1.5"
          >
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-100" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[9px] font-extrabold uppercase text-cyan-400 text-center tracking-wider">
              Dispensing Pellets ({progress}%)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warnings & Helper Statuses */}
      {!isOnline && (
        <span className="text-[10px] font-bold text-rose-400 mt-3 text-center leading-normal">
          {!mqttConnected ? "MQTT broker is disconnected" : "Awaiting hardware status signal"}
        </span>
      )}
      {isOnline && !isFeeding && servoStatus !== 'Done' && (
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-3">
          Status: Ready to trigger sweep
        </span>
      )}
      {servoStatus === 'Done' && (
        <span className="text-[10px] font-bold text-emerald-400 mt-3">
          Feeding cycle completed successfully
        </span>
      )}
    </div>
  );
};

export default FeedButton;
