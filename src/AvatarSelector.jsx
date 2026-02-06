import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export const AvatarSelector = ({ playerName, onAvatarChange, playSound }) => {
  const [seed, setSeed] = useState('');

  // Inicializa com o nome ou aleatório
  useEffect(() => {
    setSeed(playerName || Math.random().toString(36).substring(7));
  }, [playerName]);

  const getAvatarUrl = (s) => 
    `https://api.dicebear.com/9.x/notionists/svg?seed=${s}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  // Notifica o pai quando a seed muda
  useEffect(() => {
      if(seed) onAvatarChange(getAvatarUrl(seed));
  }, [seed]);

  const reroll = (e) => {
    e.preventDefault();
    if (playSound) playSound('click'); // Efeito sonoro tátil
    const randomSeed = Math.random().toString(36).substring(7);
    setSeed(randomSeed);
  };

  return (
    <div className="flex flex-col items-center gap-4 mb-6 animate-in zoom-in duration-300">
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl bg-slate-800 transition-transform group-hover:scale-105">
          <img 
            src={getAvatarUrl(seed)} 
            alt="Avatar Preview" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <button
          onClick={reroll}
          type="button"
          className="absolute bottom-0 right-0 p-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-90 hover:rotate-180"
          title="Trocar Avatar"
        >
          <RefreshCw size={20} />
        </button>
      </div>
      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Escolha seu visual</span>
    </div>
  );
};
