import React from "react";
import { Cpu, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

interface ServoWidgetProps {
  status: "Waiting" | "Feeding" | "Done" | "Error" | null;
  espOnline: boolean | null;
}

export const ServoWidget: React.FC<ServoWidgetProps> = ({ status, espOnline }) => {
  const getStatusConfig = () => {
    if (!espOnline) {
      return {
        label: "Offline",
        color: "text-slate-400",
        bg: "bg-slate-400/10",
        icon: <Cpu className="w-8 h-8 text-slate-400" />,
        desc: "Check device power connection"
      };
    }

    switch (status) {
      case "Feeding":
        return {
          label: "Feeding...",
          color: "text-cyan-400 animate-pulse",
          bg: "bg-cyan-500/10",
          icon: <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />,
          desc: "Servo motor sweep is active"
        };
      case "Done":
        return {
          label: "Feeding Done",
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          icon: <CheckCircle className="w-8 h-8 text-emerald-400" />,
          desc: "Fish fed successfully"
        };
      case "Error":
        return {
          label: "Motor Error",
          color: "text-rose-400 animate-bounce",
          bg: "bg-rose-500/10",
          icon: <AlertTriangle className="w-8 h-8 text-rose-400" />,
          desc: "Hardware blockage detected"
        };
      case "Waiting":
      default:
        return {
          label: "Standby",
          color: "text-blue-400",
          bg: "bg-blue-500/10",
          icon: <Cpu className="w-8 h-8 text-blue-400" />,
          desc: "Waiting for scheduled triggers"
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${config.bg} shrink-0`}>
        {config.icon}
      </div>
      <div>
        <h4 className={`text-base font-extrabold tracking-tight ${config.color}`}>
          {config.label}
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
          {config.desc}
        </p>
      </div>
    </div>
  );
};

export default ServoWidget;
