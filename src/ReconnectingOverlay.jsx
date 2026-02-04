import React from 'react';
import { WifiOff, Loader2 } from 'lucide-react';

const ReconnectingOverlay = () => {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse"></div>
        <div className="relative bg-[#1a1b23] p-8 rounded-full border-4 border-red-500/30 shadow-2xl flex items-center justify-center">
            <WifiOff size={64} className="text-red-500 animate-pulse" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-red-600 rounded-full p-2 animate-spin">
            <Loader2 size={20} className="text-white" />
        </div>
      </div>
      
      <h2 className="text-3xl font-black tracking-tighter uppercase mb-2 text-red-500 drop-shadow-lg">Conexão Perdida</h2>
      <p className="text-gray-400 font-mono text-sm tracking-widest animate-pulse">TENTANDO RECONECTAR...</p>
      
      <div className="mt-8 w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-red-600 w-1/3 animate-[shimmer_1s_infinite_linear]" style={{width: '100%', transformOrigin: 'left'}}></div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default ReconnectingOverlay;
