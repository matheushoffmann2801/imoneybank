import React, { useState } from 'react';
import { Gavel, TrendingUp, User, AlertCircle } from 'lucide-react';
import { formatCurrency, safeNum, formatInputCurrency, parseInputCurrency } from './utils';
import CompactModal from './CompactModal';

const AuctionModal = ({ auction, players, user, onBid, onEndAuction, properties }) => {
    const [bidAmountStr, setBidAmountStr] = useState('');
    
    if (!auction || auction.status !== 'active') return null;

    const prop = properties.find(p => p.id === auction.propId);
    const seller = players[auction.sellerId];
    const highestBidder = auction.highestBidder ? players[auction.highestBidder] : null;
    const currentBid = safeNum(auction.currentBid);
    const isSeller = user.uid === auction.sellerId;
    const isHighestBidder = user.uid === auction.highestBidder;
    const myBalance = safeNum(players[user.uid]?.balance);

    const minBid = currentBid + 1000; // Incremento mínimo

    const handleBid = () => {
        const val = parseInputCurrency(bidAmountStr);
        if (!val || val < minBid) return alert(`Lance mínimo: ${formatCurrency(minBid)}`);
        if (val > myBalance) return alert("Saldo insuficiente!");
        onBid(val);
        setBidAmountStr('');
    };

    const quickBid = (increment) => {
        const val = currentBid + increment;
        if (val > myBalance) return alert("Saldo insuficiente!");
        onBid(val);
    };

    return (
        <CompactModal title="Leilão em Andamento" onClose={() => {}} allowClose={false}>
            <div className="text-center space-y-4">
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Item do Leilão</p>
                    <h2 className="text-2xl font-black text-indigo-900">{prop?.name || 'Imóvel Desconhecido'}</h2>
                    <p className="text-xs text-indigo-600 mt-1">Vendedor: {seller?.name}</p>
                </div>

                <div className="flex flex-col items-center justify-center py-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Lance Atual</p>
                    <div className="text-4xl font-black text-emerald-600 flex items-center gap-2 animate-in zoom-in duration-300 key={currentBid}">
                        {formatCurrency(currentBid)}
                    </div>
                    {highestBidder ? (
                        <div className="flex items-center gap-1 mt-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                            <User size={12} /> {highestBidder.name}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 mt-2 italic">Nenhum lance ainda</p>
                    )}
                </div>

                {!isSeller && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => quickBid(1000)} disabled={myBalance < currentBid + 1000} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50">+1k</button>
                            <button onClick={() => quickBid(10000)} disabled={myBalance < currentBid + 10000} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50">+10k</button>
                            <button onClick={() => quickBid(50000)} disabled={myBalance < currentBid + 50000} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50">+50k</button>
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={bidAmountStr} 
                                onChange={(e) => setBidAmountStr(formatInputCurrency(e.target.value))} 
                                placeholder={`Mín: ${formatCurrency(minBid)}`}
                                className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-center font-bold outline-none focus:border-indigo-500 text-sm"
                            />
                            <button 
                                onClick={handleBid} 
                                disabled={!parseInputCurrency(bidAmountStr)}
                                className="bg-indigo-600 text-white px-4 rounded-xl font-bold shadow-lg active:scale-95 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                <TrendingUp size={18} /> LANCE
                            </button>
                        </div>
                        {isHighestBidder && <p className="text-xs text-emerald-500 font-bold animate-pulse flex items-center justify-center gap-1"><AlertCircle size={12}/> Você está ganhando!</p>}
                    </div>
                )}

                {isSeller && (
                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 mb-2">Você é o vendedor. Encerre quando estiver satisfeito.</p>
                        <button 
                            onClick={onEndAuction} 
                            className="w-full bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition flex items-center justify-center gap-2 animate-pulse"
                        >
                            <Gavel size={18} /> BATER O MARTELO
                        </button>
                    </div>
                )}
            </div>
        </CompactModal>
    );
};

export default AuctionModal;
