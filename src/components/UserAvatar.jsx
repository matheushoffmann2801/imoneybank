import React from 'react';

// Componente reutilizável de Avatar usando DiceBear API
export const UserAvatar = ({ name, size = 48, className = '' }) => {
  // Estilo 'notionists' é muito clean e profissional
  // Fallback para 'User' se o nome estiver vazio para evitar erros
  const seed = name || 'User';
  const avatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e5e7eb,b6e3f4,c0aede`;

  return (
    <div 
      className={`rounded-full overflow-hidden border-2 border-white/20 shadow-lg shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src={avatarUrl} 
        alt={name} 
        className="w-full h-full object-cover bg-slate-800"
      />
    </div>
  );
};
