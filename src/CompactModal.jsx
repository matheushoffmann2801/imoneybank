import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

const CompactModal = ({ title, onClose, children, allowClose = true }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`absolute inset-0 bg-black/60 backdrop-blur-md ${!allowClose ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
      onClick={allowClose ? onClose : null} 
    />
    <motion.div 
      initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", duration: 0.5 }}
      className="relative w-full max-w-sm bg-white/90 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <div className="px-6 py-4 border-b border-gray-200/50 flex justify-between items-center bg-white/50 backdrop-blur-md shrink-0 z-10">
        <h3 className="font-black text-gray-800 text-sm truncate pr-4 uppercase tracking-wide">{title}</h3>
        {allowClose && <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-90 transition-all"><X size={16} className="text-gray-600"/></button>}
      </div>
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-8">{children}</div>
    </motion.div>
  </div>
);

export default CompactModal;
