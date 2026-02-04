import React, { useEffect } from 'react';
import { Play } from 'lucide-react';
import { playSound } from './utils';

const StartGameModal = ({ starterName, onClose }) => {
    useEffect(() => { playSound('notification'); }, []);
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={onClose} />
             <div className="relative w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-90 bg-white border-4 border-yellow-400">
                 <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-yellow-100 text-yellow-600 animate-bounce">
                     <Play size={32} fill="currentColor"/>
                 </div>
                 <h2 className="text-2xl font-black mb-2 text-gray-800 uppercase tracking-tighter">Jogo Iniciado!</h2>
                 <p className="text-gray-500 font-medium mb-2 text-sm">Ordem definida. Quem começa:</p>
                 <div className="text-lg font-bold text-indigo-600 mb-6 bg-indigo-50 py-2 rounded-xl border border-indigo-100">{starterName}</div>
                 <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-white text-sm shadow-lg bg-yellow-500 hover:bg-yellow-600 active:scale-95 transition">VAMOS LÁ!</button>
             </div>
        </div>
    );
};

export default StartGameModal;
