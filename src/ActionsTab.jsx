import React from 'react';
import { Sparkles, Landmark, Handshake, Siren, Plane, Users, Receipt, Gavel, Dices } from 'lucide-react';

const ActionsTab = ({ 
    isProcessing, isJailed, roomData, isMyTurn, 
    onDrawCard, onShowLoan, onShowNegotiation, 
    handleTransaction, handleBoardEvent, onRollDice, diceCooldown
}) => {
    const currentPlayerName = roomData.players?.[roomData.currentPlayerId]?.name || 'Alguém';

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
             <div className="grid grid-cols-2 gap-2">
                 <button disabled={isProcessing || isJailed || (roomData.gameStarted && !isMyTurn)} onClick={onDrawCard} className="col-span-2 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-md active:scale-95 transition disabled:opacity-50 border border-white/10"><Sparkles size={20} className="text-yellow-300 animate-pulse"/> SORTE OU REVÉS</button>
                 <button disabled={isProcessing || isJailed || !isMyTurn || diceCooldown} onClick={onRollDice} className={`col-span-2 h-12 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition disabled:opacity-50 hover:bg-gray-50 ${isMyTurn && !diceCooldown ? 'animate-pulse ring-2 ring-indigo-400 border-indigo-400' : ''}`}>
                    <Dices size={18} className={isMyTurn ? "text-indigo-500" : "text-gray-400"}/> 
                    {isMyTurn 
                        ? (diceCooldown ? 'AGUARDE...' : 'ROLAR DADOS (MOVIMENTO)') 
                        : `VEZ DE: ${currentPlayerName.toUpperCase()}`}
                 </button>
                 <button disabled={isProcessing || isJailed} onClick={onShowLoan} className="bg-orange-50 border border-orange-100 text-orange-600 p-3 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 active:bg-orange-100 active:scale-95 transition disabled:opacity-50 h-24"><Landmark size={20}/> Empréstimo</button>
                 <button disabled={isProcessing || isJailed} onClick={onShowNegotiation} className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-3 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 active:bg-emerald-100 active:scale-95 transition disabled:opacity-50 h-24"><Handshake size={20}/> Negociar / Pix</button>
             </div>
             <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">Eventos de Tabuleiro</p>
                <div className="grid grid-cols-3 gap-2">
                    <button disabled={isProcessing || isJailed || (roomData.gameStarted && !isMyTurn)} onClick={()=>handleTransaction('go_to_jail', 0)} className="bg-slate-50 text-slate-600 p-2 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-100 active:scale-95 transition disabled:opacity-50 border border-slate-100"><Siren size={16} className="text-red-500"/><span className="text-[8px] font-bold">CADEIA</span></button>
                    <button disabled={isProcessing || isJailed || (roomData.gameStarted && !isMyTurn)} onClick={()=>handleBoardEvent('feriado')} className="bg-slate-50 text-slate-600 p-2 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-100 active:scale-95 transition disabled:opacity-50 border border-slate-100"><Plane size={16} className="text-blue-500"/><span className="text-[8px] font-bold">FERIADO</span></button>
                    <button disabled={isProcessing || isJailed || (roomData.gameStarted && !isMyTurn)} onClick={()=>handleBoardEvent('visita')} className="bg-slate-50 text-slate-600 p-2 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-100 active:scale-95 transition disabled:opacity-50 border border-slate-100"><Users size={16} className="text-purple-500"/><span className="text-[8px] font-bold">VISITA</span></button>
                    <button disabled={isProcessing || isJailed || (roomData.gameStarted && !isMyTurn)} onClick={()=>handleTransaction('income', 200000, null, 'Restituição IR')} className="bg-slate-50 text-emerald-600 p-2 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-emerald-100 active:scale-95 transition disabled:opacity-50 border border-slate-100"><Receipt size={16}/><span className="text-[8px] font-bold">RESTITUIÇÃO</span></button>
                    <button disabled={isProcessing || isJailed || (roomData.gameStarted && !isMyTurn)} onClick={()=>handleTransaction('expense', 200000, null, 'Receita Federal')} className="bg-slate-50 text-red-600 p-2 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-red-100 active:scale-95 transition disabled:opacity-50 border border-slate-100"><Gavel size={16}/><span className="text-[8px] font-bold">RECEITA</span></button>
                </div>
             </div>
          </div>
    );
};

export default ActionsTab;
