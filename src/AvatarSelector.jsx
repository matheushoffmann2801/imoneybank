import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

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

  const PickerContent = ({ bgColor }) => (
    <div style={{ position: 'relative', zIndex: 10 }}>
      {/* Preview */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
        <div className={`${currentColor.bg} ring-2 ${currentColor.ring}/30`}
          style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <span style={{ fontSize: 32, lineHeight: 1, userSelect: 'none' }}>{selectedEmoji}</span>
        </div>
        <div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{playerName}</p>
          <p style={{ color: '#6b7280', fontSize: 12 }}>Selecione seu avatar</p>
        </div>
      </div>

      {/* Emoji Grid */}
      <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Personagem</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, marginBottom: 16 }}>
        {AVATAR_EMOJIS.map((emoji) => (
          <button key={emoji} type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedEmoji(emoji); if (playSound) playSound('click'); }}
            style={{
              aspectRatio: '1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, cursor: 'pointer', border: 'none', padding: 0, transition: 'transform 0.15s',
              background: selectedEmoji === emoji ? 'rgba(16,185,129,0.25)' : bgColor,
              outline: selectedEmoji === emoji ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.06)',
              transform: selectedEmoji === emoji ? 'scale(1.08)' : 'scale(1)',
              boxShadow: selectedEmoji === emoji ? '0 4px 12px rgba(16,185,129,0.2)' : 'none',
            }}
          >{emoji}</button>
        ))}
      </div>

      {/* Color Selector */}
      <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Cor do fundo</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {AVATAR_COLORS.map((color, idx) => (
          <button key={idx} type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedColorIdx(idx); if (playSound) playSound('click'); }}
            className={color.bg}
            style={{
              width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', border: 'none', padding: 0,
              transition: 'transform 0.15s, opacity 0.15s',
              outline: selectedColorIdx === idx ? '2px solid white' : 'none',
              outlineOffset: selectedColorIdx === idx ? 3 : 0,
              opacity: selectedColorIdx === idx ? 1 : 0.6,
              transform: selectedColorIdx === idx ? 'scale(1.15)' : 'scale(1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >{selectedColorIdx === idx && <Check size={14} style={{ color: 'white', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />}</button>
        ))}
      </div>

      {/* Confirm */}
      <button type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); if (playSound) playSound('click'); }}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: '#10b981', color: 'white', fontWeight: 700, fontSize: 14,
          boxShadow: '0 4px 16px rgba(16,185,129,0.3)', transition: 'transform 0.1s',
        }}
        onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >Confirmar</button>
    </div>
  );

  // Compact mode (for header)
  if (compact) {
    return (
      <>
        <button type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); if (playSound) playSound('click'); }}
          className={`${currentColor.bg} ring-2 ${currentColor.ring}/20`}
          style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', flexShrink: 0, cursor: 'pointer', border: 'none', padding: 0 }}
        >
          <span style={{ fontSize: 24, lineHeight: 1, userSelect: 'none' }}>{selectedEmoji}</span>
        </button>

        {isOpen && (
          <div
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 480, borderRadius: '24px 24px 0 0',
                padding: '20px 20px 32px', background: '#111318',
                border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, margin: '0 auto 16px' }} />
              <PickerContent bgColor="rgba(255,255,255,0.05)" />
            </div>
          </div>
        )}
      </>
    );
  }

  // Full mode (for AuthScreen)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <button type="button"
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); if (playSound) playSound('click'); }}
        className={`${currentColor.bg} ring-2 ${currentColor.ring}/30`}
        style={{ width: 72, height: 72, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(0,0,0,0.3)', cursor: 'pointer', border: 'none', padding: 0, position: 'relative' }}
      >
        <span style={{ fontSize: 36, lineHeight: 1, userSelect: 'none' }}>{selectedEmoji}</span>
        <div style={{
          position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
      </button>
      <span style={{ color: '#4b5563', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {isOpen ? 'Selecione' : 'Toque para editar'}
      </span>

      {isOpen && (
        <div style={{ width: '100%' }}>
          <PickerContent bgColor="rgba(255,255,255,0.04)" />
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
