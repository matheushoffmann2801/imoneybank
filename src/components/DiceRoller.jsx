import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dices } from 'lucide-react';

export const DiceRoller = ({ onRoll, disabled, isMyTurn }) => {
  const [isRolling, setIsRolling] = useState(false);

  const handleClick = () => {
    if (disabled || isRolling) return;
    setIsRolling(true);
    onRoll();
    // Mantém a animação visual por um tempo curto
    setTimeout(() => setIsRolling(false), 1000);
  };

  return (
    <button
      disabled={disabled || isRolling}
      onClick={handleClick}
      className={`
        relative group w-full p-4 rounded-xl flex items-center justify-between gap-3 overflow-hidden
        ${disabled 
            ? 'bg-slate-800 border border-slate-700 opacity-50 cursor-not-allowed' 
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 cursor-pointer border border-indigo-400/30'}
        transition-all duration-300
      `}
    >
      {/* Fundo animado se for a vez */}
      {isMyTurn && !disabled && (
        <div className="absolute inset-0 bg-white/10 animate-pulse" />
      )}

      <div className="flex items-center gap-3 z-10">
        <motion.div
          animate={isRolling ? { rotate: 360, scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
          className="bg-white/20 p-2 rounded-lg"
        >
          <Dices size={28} className="text-white" />
        </motion.div>
        
        <div className="text-left">
          <span className={`block text-[10px] font-bold uppercase tracking-wider ${disabled ? 'text-slate-500' : 'text-indigo-200'}`}>
            {isMyTurn ? 'Sua Vez' : 'Aguarde'}
          </span>
          <span className="block text-lg font-black text-white leading-none">
            ROLAR DADOS
          </span>
        </div>
      </div>

      {!disabled && isMyTurn && (
        <div className="z-10 bg-white text-indigo-600 text-[10px] font-bold px-2 py-1 rounded shadow animate-bounce">
            JOGAR!
        </div>
      )}
    </button>
  );
};
