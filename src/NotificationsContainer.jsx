import React from 'react';
import { Bell, Handshake, Megaphone, Skull, MessageCircle, Info, X } from 'lucide-react';

const NotificationsContainer = ({ notifications, onClose, onClearAll }) => (
  <div className="fixed top-4 left-4 right-4 z-[90] flex flex-col gap-2 pointer-events-none transition-all">
    {notifications.length > 1 && (
      <button onClick={onClearAll} className="pointer-events-auto self-end px-3 py-1 text-[9px] font-bold bg-gray-800/80 backdrop-blur text-white rounded-full shadow-lg hover:bg-gray-700 transition-all active:scale-90">Limpar Tudo</button>
    )}
    {notifications.map((data) => (
      <div key={data.id} onClick={() => onClose(data.id)} className={`pointer-events-auto w-full p-3 rounded-2xl shadow-2xl border-l-[6px] flex items-center gap-3 animate-in slide-in-from-top-4 fade-in zoom-in-95 duration-500 ease-out cursor-pointer backdrop-blur-xl bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all ${data.type === 'income' ? 'border-emerald-500 shadow-emerald-500/10' : (data.type === 'bankrupt' || data.type === 'jail' || data.type === 'expense' || data.type === 'offer_rejected' ? 'border-red-600 bg-red-50/90 shadow-red-500/10' : (data.type === 'offer' ? 'border-yellow-500 bg-yellow-50/90 shadow-yellow-500/10' : (data.type === 'turn' ? 'border-emerald-500 bg-emerald-50/90 shadow-emerald-500/10' : (data.type === 'chat' ? 'border-blue-500 bg-blue-50/90 shadow-blue-500/10' : 'border-gray-400'))))}`}>
        <div className={`p-2.5 rounded-full shrink-0 shadow-sm ${data.type === 'income' ? 'bg-emerald-100 text-emerald-600' : (data.type === 'offer' ? 'bg-yellow-500 text-white' : (data.type === 'turn' ? 'bg-emerald-500 text-white animate-bounce' : (data.type === 'bankrupt' || data.type === 'offer_rejected' ? 'bg-red-600 text-white' : (data.type === 'chat' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'))))}`}>
          {data.type === 'income' ? <Bell size={18} /> : (data.type === 'offer' ? <Handshake size={18}/> : (data.type === 'turn' ? <Megaphone size={18}/> : (data.type === 'bankrupt' || data.type === 'offer_rejected' ? <Skull size={18}/> : (data.type === 'chat' ? <MessageCircle size={18}/> : <Info size={18} />))))}
        </div>
        <div className="flex-1 min-w-0"><p className="font-black text-xs text-gray-800 truncate tracking-tight">{String(data.title)}</p><p className="text-[10px] font-medium text-gray-500 truncate leading-tight">{String(data.msg)}</p></div>
        <button className="p-1 rounded-full hover:bg-black/5 transition-colors"><X size={14} className="text-gray-400"/></button>
      </div>
    ))}
  </div>
);

export default NotificationsContainer;
