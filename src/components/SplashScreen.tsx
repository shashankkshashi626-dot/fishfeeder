import React from "react";
import { motion } from "framer-motion";
import { Fish } from "lucide-react";

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-950 to-indigo-950 text-white select-none">
      
      {/* Animated Brand Emblem */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ 
          scale: [0.7, 1.1, 1], 
          opacity: 1,
          rotate: [0, 0, 360, 360],
        }}
        transition={{ 
          duration: 1.8, 
          ease: "easeInOut",
          times: [0, 0.4, 0.8, 1],
          repeat: Infinity,
          repeatDelay: 1
        }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-cyan-500/35 border border-cyan-300/20"
      >
        <Fish className="w-12 h-12 text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]" />
      </motion.div>

      {/* Brand Text */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="text-center mt-8 space-y-2"
      >
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-200 bg-clip-text text-transparent">
          OhmNest
        </h1>
        <p className="text-cyan-400/80 text-xs font-bold tracking-widest uppercase">
          FishFeeder Pro v3.0
        </p>
      </motion.div>

      {/* Pulse loading indicator */}
      <div className="absolute bottom-16 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
      </div>

    </div>
  );
};

export default SplashScreen;
