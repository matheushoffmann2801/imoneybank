import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

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

export const AvatarSelector = ({ playerName, currentAvatar, onAvatarChange, playSound, compact = false }) => {
  const [selectedEmoji, setSelectedEmoji] = useState('🦁');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (currentAvatar && !currentAvatar.startsWith('http')) {
      const parts = currentAvatar.split('|');
      if (parts.length === 2) {
        setSelectedEmoji(parts[0]);
        setSelectedColorIdx(parseInt(parts[1]) || 0);
      }
    }
  }, []);

  useEffect(() => {
    const avatarValue = `${selectedEmoji}|${selectedColorIdx}`;
    onAvatarChange(avatarValue);
  }, [selectedEmoji, selectedColorIdx]);

  const currentColor = AVATAR_COLORS[selectedColorIdx] || AVATAR_COLORS[0];

  // Compact inline mode (for header)
  if (compact) {
    return (
      <>
        <button type="button" onClick={() => { setIsOpen(true); if (playSound) playSound('click'); }}
          className={`w-11 h-11 rounded-xl ${currentColor.bg} flex items-center justify-center shadow-lg shrink-0 ring-2 ${currentColor.ring}/20 active:scale-90 transition-transform`}
        >
          <span className="text-2xl select-none drop-shadow" style={{ lineHeight: 1 }}>{selectedEmoji}</span>
        </button>

        {/* Fullscreen bottom sheet picker */}
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}
            style={{ animation: 'fadeIn 0.15s ease' }}>
            <div onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-t-3xl p-5 pb-8 safe-area-bottom"
              style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>

              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-4" />

              {/* Preview */}
              <div className="flex items-center justify-center gap-4 mb-5">
                <div className={`w-16 h-16 rounded-2xl ${currentColor.bg} flex items-center justify-center shadow-xl ring-2 ${currentColor.ring}/30`}>
                  <span className="text-4xl select-none drop-shadow" style={{ lineHeight: 1 }}>{selectedEmoji}</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{playerName}</p>
                  <p className="text-gray-500 text-xs">Personalize seu avatar</p>
                </div>
              </div>

              {/* Emoji Grid */}
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Personagem</p>
              <div className="grid grid-cols-8 gap-2 mb-4">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button key={emoji} type="button"
                    onClick={() => { setSelectedEmoji(emoji); if (playSound) playSound('click'); }}
                    className={`aspect-square rounded-xl flex items-center justify-center text-xl transition-all active:scale-90 ${
                      selectedEmoji === emoji ? 'bg-white/15 ring-2 ring-emerald-400 shadow-lg scale-105' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >{emoji}</button>
                ))}
              </div>

              {/* Color Selector */}
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Cor</p>
              <div className="flex justify-center gap-2.5 flex-wrap mb-5">
                {AVATAR_COLORS.map((color, idx) => (
                  <button key={idx} type="button"
                    onClick={() => { setSelectedColorIdx(idx); if (playSound) playSound('click'); }}
                    className={`w-9 h-9 rounded-full ${color.bg} transition-all active:scale-90 ${
                      selectedColorIdx === idx ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111318] scale-110 shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                  >{selectedColorIdx === idx && <Check size={14} className="mx-auto text-white drop-shadow" />}</button>
                ))}
              </div>

              <button type="button" onClick={() => setIsOpen(false)}
                className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm active:scale-[0.98] transition shadow-lg shadow-emerald-500/20"
              >Confirmar</button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Full mode (for AuthScreen)
  return (
    <div className="flex flex-col items-center gap-3">
      <button type="button" onClick={() => { setIsOpen(!isOpen); if (playSound) playSound('click'); }} className="relative group">
        <div className={`w-20 h-20 rounded-2xl ${currentColor.bg} flex items-center justify-center shadow-2xl ring-2 ${currentColor.ring}/30 transition-all group-hover:scale-105 group-active:scale-95`}>
          <span className="text-4xl select-none drop-shadow-md" style={{ lineHeight: 1 }}>{selectedEmoji}</span>
        </div>
        <div className="absolute -bottom-1 -right-1 bg-white/10 backdrop-blur-md border border-white/20 text-white p-1.5 rounded-full shadow-lg">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
      </button>
      <span className="text-gray-600 text-[9px] font-bold uppercase tracking-[0.15em]">{isOpen ? 'Selecione' : 'Toque para editar'}</span>

      {isOpen && (
        <div className="w-full space-y-3" style={{ animation: 'slideUp 0.25s ease' }}>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/[0.06]">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 text-center">Personagem</p>
            <div className="grid grid-cols-8 gap-1.5">
              {AVATAR_EMOJIS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => { setSelectedEmoji(emoji); if (playSound) playSound('click'); }}
                  className={`aspect-square rounded-lg flex items-center justify-center text-lg transition-all active:scale-90 ${
                    selectedEmoji === emoji ? 'bg-white/15 ring-2 ring-emerald-400 scale-105' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >{emoji}</button>
              ))}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/[0.06]">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 text-center">Cor</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {AVATAR_COLORS.map((color, idx) => (
                <button key={idx} type="button" onClick={() => { setSelectedColorIdx(idx); if (playSound) playSound('click'); }}
                  className={`w-8 h-8 rounded-full ${color.bg} transition-all active:scale-90 ${
                    selectedColorIdx === idx ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                >{selectedColorIdx === idx && <Check size={12} className="mx-auto text-white" />}</button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => { setIsOpen(false); if (playSound) playSound('click'); }}
            className="w-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase active:scale-[0.98] transition"
          >✓ Confirmar</button>
        </div>
      )}
    </div>
  );
};

export const AVATAR_COLORS_LIST = AVATAR_COLORS;
export const parseAvatar = (avatarStr) => {
  if (!avatarStr || avatarStr.startsWith('http')) return { emoji: '🦁', colorIdx: 0 };
  const parts = avatarStr.split('|');
  return { emoji: parts[0] || '🦁', colorIdx: parseInt(parts[1]) || 0 };
};
