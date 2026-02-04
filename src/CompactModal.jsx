import React from 'react';
import { X } from 'lucide-react';

const CompactModal = ({ title, onClose, children, allowClose = true }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className={`absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500 ${!allowClose ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={allowClose ? onClose : null} />
    <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl animate-in zoom-in-90 slide-in-from-bottom-4 duration-300 ease-out overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/20">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md shrink-0 z-10">
        <h3 className="font-black text-gray-800 text-sm truncate pr-4 uppercase tracking-wide">{title}</h3>
        {allowClose && <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-90 transition-all"><X size={16} className="text-gray-600"/></button>}
      </div>
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-8">{children}</div>
    </div>
  </div>
);

export default CompactModal;
