import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

interface FooterProps {
  mqttConnected: boolean;
}

export const Footer: React.FC<FooterProps> = ({ mqttConnected }) => {
  return (
    <footer className="mt-auto py-6 px-6 border-t border-slate-200 dark:border-slate-800/50 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-950/30 transition-colors duration-300">
      <div className="flex items-center gap-2 mb-3 sm:mb-0">
        <ShieldCheck className="w-4 h-4 text-cyan-500" />
        <span>Secured SSL Broker Direct Connection</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Cpu className={`w-3.5 h-3.5 ${mqttConnected ? 'text-emerald-500' : 'text-slate-400 animate-pulse'}`} />
          <span>MQTT Client Service v1.0</span>
        </div>
        <span className="text-slate-300 dark:text-slate-800">|</span>
        <span>© {new Date().getFullYear()} FishFeeder Commercial IoT</span>
      </div>
    </footer>
  );
};
export default Footer;
