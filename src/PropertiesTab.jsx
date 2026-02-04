import React, { useState } from 'react';
import { Star, Search, X, Lock } from 'lucide-react';
import { PROPERTIES_DB, COLORS } from './PropertiesDB';
import { formatCurrency } from './utils';

const PropertiesTab = ({ 
    players, user, forceBuyMode, stealPropMode, 
    handleTransaction, setForceBuyMode, setStealPropMode, 
    setShowPropertyDetails, hasMonopoly 
}) => {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filters = [
        { id: 'all', label: 'Todos', activeClass: 'bg-gray-800 border-gray-800 text-white' },
        { id: 'available', label: 'Livres', activeClass: 'bg-emerald-600 border-emerald-600 text-white' },
        { id: user.uid, label: 'Meus', activeClass: 'bg-indigo-600 border-indigo-600 text-white' },
        ...Object.values(players).filter(p => p.id !== user.uid).map(p => ({
            id: p.id,
            label: p.name,
            activeClass: 'bg-blue-500 border-blue-500 text-white'
        }))
    ];

    const normalizeText = (text) => {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <div className="relative px-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-gray-400" />
                </div>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar propriedade..." 
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-8 text-xs font-bold outline-none focus:border-indigo-500 transition shadow-sm placeholder:font-normal"
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar px-1">
                {filters.map(f => (
                    <button 
                        key={f.id} 
                        onClick={() => setFilter(f.id)} 
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all ${filter === f.id ? `${f.activeClass} shadow-md` : 'bg-white text-gray-400 border-gray-200'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
            <div className="space-y-1.5">
                {PROPERTIES_DB.filter(prop => {
                    if (searchTerm) {
                        const term = normalizeText(searchTerm);
                        const name = normalizeText(prop.name);
                        if (!name.includes(term)) return false;
                    }

                    const ownerId = Object.keys(players).find(uid => players[uid].properties?.includes(prop.id));
                    if (filter === 'all') return true;
                    if (filter === 'available') return !ownerId;
                    return ownerId === filter;
                }).map(prop => { const ownerId = Object.keys(players).find(uid => players[uid].properties?.includes(prop.id)); const isMine = ownerId === user.uid; const isOwned = !!ownerId; const owner = isOwned ? players[ownerId] : null; const colorMap = COLORS[prop.group] || 'bg-gray-500'; const houses = (players[ownerId]?.houses || {})[prop.id] || 0; const totalBuyCost = prop.price + (houses * (prop.houseCost || 0)); const hasGroupMonopoly = hasMonopoly(prop.group); const isMortgaged = (players[ownerId]?.mortgaged || []).includes(prop.id); const handleCardClick = (e) => { e.stopPropagation(); if (forceBuyMode) { if (isMine) return alert("Você já é dono!"); const groupProps = PROPERTIES_DB.filter(p => p.group === prop.group); const hasHousesInGroup = isOwned ? groupProps.some(p => (players[ownerId]?.houses || {})[p.id] > 0) : false; if (hasHousesInGroup) return alert("Não é permitido comprar imóveis de grupos com construções!"); handleTransaction('force_buy', totalBuyCost, ownerId || 'BANK', prop.name, prop.id); setForceBuyMode(false); } else if (stealPropMode) { if (isMine) return alert("Você já é dono!"); if (!isOwned) return alert("Este imóvel não tem dono! Use Compra Livre ou compre do banco."); const groupProps = PROPERTIES_DB.filter(p => p.group === prop.group); const hasHousesInGroup = groupProps.some(p => (players[ownerId]?.houses || {})[p.id] > 0); if (hasHousesInGroup) return alert("Não é permitido roubar imóveis de grupos com construções!"); handleTransaction('steal_prop', 0, ownerId, prop.name, prop.id); setStealPropMode(false); } else { setShowPropertyDetails(prop.id); } }; return (<div key={prop.id} onClick={handleCardClick} className={`relative flex flex-col p-2.5 rounded-xl border text-left transition-all ${forceBuyMode && !isMine ? 'ring-4 ring-emerald-500 bg-emerald-50 scale-[1.02] shadow-xl z-10 animate-pulse cursor-pointer' : (stealPropMode && !isMine && isOwned ? 'ring-4 ring-red-500 bg-red-50 scale-[1.02] shadow-xl z-10 animate-pulse cursor-pointer' : (isMine ? 'bg-emerald-50 border-emerald-200 shadow-sm' : (isOwned ? 'bg-white border-gray-200 cursor-pointer opacity-75' : 'bg-white border-gray-100 cursor-pointer')))}`}>{forceBuyMode && !isMine && (<div className="absolute -top-3 left-0 right-0 flex justify-center z-20 pointer-events-none"><span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">CLIQUE PARA COMPRAR</span></div>)}{stealPropMode && !isMine && isOwned && (<div className="absolute -top-3 left-0 right-0 flex justify-center z-20 pointer-events-none"><span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">CLIQUE PARA ROUBAR</span></div>)}<div className="flex justify-between items-center w-full mb-0.5 pointer-events-none"><div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${colorMap}`}></div><span className="font-bold text-gray-800 text-xs truncate max-w-[150px]">{prop.name}</span>{hasGroupMonopoly && isMine && <Star size={10} className="text-yellow-500 fill-yellow-500"/>}{isMortgaged && <Lock size={10} className="text-red-500"/>}</div><span className="font-mono text-xs font-bold text-indigo-600">{formatCurrency(prop.price)}</span></div><div className="flex justify-between items-center mt-0.5 pointer-events-none">{isOwned ? (<div className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold w-full text-center truncate ${isMine ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{isMine ? 'SUA PROPRIEDADE' : `DONO: ${owner.avatar || ''} ${owner.name}`} {houses > 0 && `(${houses} 🏠)`} {isMortgaged && '(HIPOTECADO)'}</div>) : (<div className="text-[8px] text-gray-400 w-full text-center">DISPONÍVEL</div>)}</div></div>) })}
            </div>
        </div>
    );
};

export default PropertiesTab;
