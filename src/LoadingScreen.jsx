import React from 'react';
import { Landmark } from 'lucide-react';

const LoadingScreen = ({ message }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1a1b23]/40 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
        <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/40 blur-2xl rounded-full animate-pulse"></div>
            <div className="bg-[#1a1b23] p-4 rounded-2xl border border-white/10 shadow-2xl relative z-10 ring-1 ring-white/5">
                <Landmark size={32} className="text-emerald-400" />
            </div>
        </div>
        {message && <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] drop-shadow-md">{message}</span>}
      </div>
    </div>
  );
};

export default LoadingScreen;