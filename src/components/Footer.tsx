import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-5 px-6 border-t border-slate-200/60 dark:border-slate-800/40 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-white/30 dark:bg-slate-950/20 transition-colors duration-300">
      <div className="flex items-center gap-2 mb-2.5 sm:mb-0">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span className="uppercase tracking-wider">Secured Broker Connection</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="uppercase tracking-wider">
          © {new Date().getFullYear()} OhmNest · FishFeeder Pro v3.0
        </span>
      </div>
    </footer>
  );
};

export default Footer;
