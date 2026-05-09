import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const AVATAR_EMOJIS = [
  '🦁', '🐯', '🦊', '🐺', '🐻', '🦅', '🦈', '🐉',
  '👑', '💎', '🔥', '⚡', '🌟', '🎯', '🏆', '🎲',
  '🤑', '😎', '🥶', '🤖', '👻', '🎭', '🧙', '🦸',
  '🚀', '💰', '🏦', '🎰', '🃏', '♟️', '🧊', '🌈',
];

const AVATAR_COLORS = [
  { bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', ring: 'ring-emerald-400' },
  { bg: 'bg-gradient-to-br from-indigo-500 to-purple-600', ring: 'ring-indigo-400' },
  { bg: 'bg-gradient-to-br from-rose-500 to-pink-600', ring: 'ring-rose-400' },
  { bg: 'bg-gradient-to-br from-amber-500 to-orange-600', ring: 'ring-amber-400' },
  { bg: 'bg-gradient-to-br from-cyan-500 to-blue-600', ring: 'ring-cyan-400' },
  { bg: 'bg-gradient-to-br from-violet-500 to-fuchsia-600', ring: 'ring-violet-400' },
  { bg: 'bg-gradient-to-br from-red-500 to-rose-700', ring: 'ring-red-400' },
  { bg: 'bg-gradient-to-br from-lime-500 to-green-600', ring: 'ring-lime-400' },
  { bg: 'bg-gradient-to-br from-sky-500 to-indigo-600', ring: 'ring-sky-400' },
  { bg: 'bg-gradient-to-br from-yellow-400 to-amber-600', ring: 'ring-yellow-400' },
];

export const AvatarSelector = ({ playerName, currentAvatar, onAvatarChange, playSound }) => {
  const [selectedEmoji, setSelectedEmoji] = useState('🦁');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Parse current avatar if already set
  useEffect(() => {
    if (currentAvatar && !currentAvatar.startsWith('http')) {
      // Format: "emoji|colorIdx"
      const parts = currentAvatar.split('|');
      if (parts.length === 2) {
        setSelectedEmoji(parts[0]);
        setSelectedColorIdx(parseInt(parts[1]) || 0);
      }
    }
  }, []);

  // Notify parent of changes
  useEffect(() => {
    const avatarValue = `${selectedEmoji}|${selectedColorIdx}`;
    onAvatarChange(avatarValue);
  }, [selectedEmoji, selectedColorIdx]);

  const currentColor = AVATAR_COLORS[selectedColorIdx] || AVATAR_COLORS[0];

  return (
    <div className="flex flex-col items-center gap-3 mb-4">
      {/* Avatar Preview */}
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); if (playSound) playSound('click'); }}
        className="relative group"
      >
        <div className={`w-24 h-24 rounded-full ${currentColor.bg} flex items-center justify-center shadow-2xl ring-4 ${currentColor.ring}/30 transition-all duration-300 group-hover:scale-105 group-active:scale-95`}>
          <span className="text-5xl select-none drop-shadow-md filter saturate-150" style={{ lineHeight: 1 }}>
            {selectedEmoji}
          </span>
        </div>
        <div className="absolute -bottom-1 -right-1 bg-white/10 backdrop-blur-md border border-white/20 text-white p-1.5 rounded-full shadow-lg transition-all group-hover:scale-110 group-hover:bg-white/20">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
      </button>
      
      <span className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em]">
        {isOpen ? 'Selecione seu avatar' : 'Toque para personalizar'}
      </span>

      {/* Expanded Selector */}
      {isOpen && (
        <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
          {/* Emoji Grid */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-2 text-center">Personagem</p>
            <div className="grid grid-cols-8 gap-1.5">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { setSelectedEmoji(emoji); if (playSound) playSound('click'); }}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xl transition-all duration-200 active:scale-90 ${
                    selectedEmoji === emoji 
                      ? 'bg-white/20 ring-2 ring-emerald-400 scale-110 shadow-lg' 
                      : 'bg-white/5 hover:bg-white/10 hover:scale-105'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-2 text-center">Cor do Fundo</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {AVATAR_COLORS.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setSelectedColorIdx(idx); if (playSound) playSound('click'); }}
                  className={`w-8 h-8 rounded-full ${color.bg} transition-all duration-200 active:scale-90 ${
                    selectedColorIdx === idx 
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110 shadow-lg' 
                      : 'hover:scale-110 opacity-70 hover:opacity-100'
                  }`}
                >
                  {selectedColorIdx === idx && (
                    <Check size={14} className="mx-auto text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm */}
          <button
            type="button"
            onClick={() => { setIsOpen(false); if (playSound) playSound('click'); }}
            className="w-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase active:scale-95 transition-all hover:bg-emerald-500/30"
          >
            ✓ Confirmar Visual
          </button>
        </div>
      )}
    </div>
  );
};

// Helper to render the avatar anywhere in the app
export const AVATAR_COLORS_LIST = AVATAR_COLORS;
export const parseAvatar = (avatarStr) => {
  if (!avatarStr || avatarStr.startsWith('http')) {
    return { emoji: '🦁', colorIdx: 0 };
  }
  const parts = avatarStr.split('|');
  return {
    emoji: parts[0] || '🦁',
    colorIdx: parseInt(parts[1]) || 0,
  };
};
