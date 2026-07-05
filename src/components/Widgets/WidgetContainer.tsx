import React from "react";
import { motion } from "framer-motion";
import { Trash2, Maximize2, Minimize2 } from "lucide-react";

interface WidgetContainerProps {
  id: string;
  size: "sm" | "md" | "lg";
  type: string;
  title: string;
  onDelete: () => void;
  onResize: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: React.ReactNode;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  size,
  title,
  onDelete,
  onResize,
  onMoveUp,
  onMoveDown,
  children,
}) => {
  // Map size configuration to tailwind grid column spans
  const sizeClasses = {
    sm: "col-span-1 h-[170px]",
    md: "col-span-1 sm:col-span-2 h-[170px]",
    lg: "col-span-1 sm:col-span-2 lg:col-span-4 h-auto min-h-[170px]",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`${sizeClasses[size]} rounded-3xl border border-slate-200/80 dark:border-slate-800/40 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between group`}
    >
      {/* Header controls (visible on group hover or active edit mode) */}
      <div className="flex justify-between items-center mb-2 z-10">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {title}
        </span>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 bg-slate-100/80 dark:bg-slate-950/80 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
          
          {/* Reordering Controls */}
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-1 text-slate-400 hover:text-cyan-400 rounded-md transition-colors"
              title="Move Left/Up"
            >
              <span className="text-xs font-bold font-mono">←</span>
            </button>
          )}

          {onMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-1 text-slate-400 hover:text-cyan-400 rounded-md transition-colors"
              title="Move Right/Down"
            >
              <span className="text-xs font-bold font-mono">→</span>
            </button>
          )}

          {/* Resize Control */}
          <button
            onClick={onResize}
            className="p-1 text-slate-400 hover:text-cyan-400 rounded-md transition-colors"
            title="Toggle Size"
          >
            {size === "sm" ? (
              <Maximize2 className="w-3 h-3" />
            ) : (
              <Minimize2 className="w-3 h-3" />
            )}
          </button>

          {/* Delete Control */}
          <button
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
            title="Remove Widget"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Widget Body Content */}
      <div className="flex-1 flex flex-col justify-center">
        {children}
      </div>

    </motion.div>
  );
};

export default WidgetContainer;
