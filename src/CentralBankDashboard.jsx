import React, { useState } from 'react';
import { Users, DollarSign, Gavel, Siren, Unlock, SkipForward, Sparkles, LogOut, Landmark, Search, AlertTriangle, Trash2, Snowflake, Ban, Backpack, ClipboardList, Activity } from 'lucide-react';
import { formatCurrency, formatInputCurrency, parseInputCurrency } from './utils';
import CompactModal from './CompactModal';
import { PROPERTIES_DB } from './PropertiesDB';

const ITEM_NAMES = {
  'habeas_corpus': 'Habeas Corpus',
  'free_buy': 'Compra Livre',
  'steal_prop': 'Usucapião',
  'black_card': 'Cartão Black'
};

const CentralBankDashboard = ({ roomData, players, handleTransaction, onLogout, onDrawCard, onCloseRoom }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [amountStr, setAmountStr] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('players'); // 'players' or 'logs'

    const selectedPlayer = players[selectedPlayerId];

    const executeAction = (type, targetId = null, val = 0, note = '', propId = null) => {
        handleTransaction(type, val, targetId, note, propId);
        setAmountStr('');
    };

    return (
        <div className="fixed inset-0 bg-slate-900 text-white flex flex-col font-sans">
            {/* Header */}
            <div className="bg-slate-800 p-4 shadow-lg border-b border-slate-700 flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                        <Landmark size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white">BANCO CENTRAL</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administração Financeira</p>
                    </div>
                </div>
                <button onClick={onLogout} className="bg-red-500/20 text-red-400 p-2 rounded-lg hover:bg-red-500 hover:text-white transition">
                    <LogOut size={20} />
                </button>
            </div>

            {/* Global Actions Bar */}
            <div className="bg-slate-800/50 p-3 flex gap-2 overflow-x-auto border-b border-slate-700">
                <button onClick={() => setActiveTab('players')} className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-md transition ${activeTab === 'players' ? 'bg-slate-700 text-white border border-slate-500' : 'bg-slate-800 text-slate-400'}`}>
                    <Users size={16} /> JOGADORES
                </button>
                <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-md transition ${activeTab === 'logs' ? 'bg-slate-700 text-white border border-slate-500' : 'bg-slate-800 text-slate-400'}`}>
                    <ClipboardList size={16} /> LOGS
                </button>
                <div className="w-px h-8 bg-slate-700 mx-2"></div>
                <button onClick={() => executeAction('pass_turn')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 whitespace-nowrap">
                    <SkipForward size={16} /> PASSAR VEZ
                </button>
                <button onClick={onDrawCard} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 whitespace-nowrap">
                    <Sparkles size={16} /> SORTE/REVÉS
                </button>
                <button onClick={() => { if(confirm("ATENÇÃO: Isso destruirá 1 casa de CADA jogador que possuir construções. Continuar?")) executeAction('global_earthquake'); }} className="bg-orange-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 whitespace-nowrap border border-orange-600">
                    <Activity size={16} /> TERREMOTO
                </button>
                <button onClick={onCloseRoom} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 whitespace-nowrap ml-auto">
                    <Trash2 size={16} /> FECHAR SALA
                </button>
            </div>

            {/* Main Content */}
            {activeTab === 'logs' ? (
                <div className="flex-1 bg-slate-900 p-4 overflow-y-auto">
                    <h2 className="text-lg font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><ClipboardList size={20}/> Auditoria do Sistema</h2>
                    <div className="space-y-2">
                        {(!roomData.adminLogs || roomData.adminLogs.length === 0) ? (
                            <p className="text-slate-600 italic text-sm">Nenhum registro de auditoria.</p>
                        ) : (
                            roomData.adminLogs.map(log => (
                                <div key={log.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-white">{log.description}</p>
                                        <p className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                                    </div>
                                    <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-700">{log.action}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Player List */}
                <div className="w-full md:w-1/3 bg-slate-900 border-r border-slate-700 flex flex-col">
                    <div className="p-3 border-b border-slate-700">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-3 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Buscar cidadão..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 text-white pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {Object.values(players).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => setSelectedPlayerId(p.id)}
                                className={`p-3 rounded-xl cursor-pointer transition border ${selectedPlayerId === p.id ? 'bg-emerald-600/20 border-emerald-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{p.avatar}</span>
                                        <div>
                                            <p className="font-bold text-sm text-white">{p.name}</p>
                                            <p className="text-[10px] font-mono text-emerald-400">{formatCurrency(p.balance)}</p>
                                        </div>
                                    </div>
                                    {p.isJailed && <Siren size={16} className="text-red-500 animate-pulse" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Player Detail / Actions */}
                <div className="flex-1 bg-slate-900 p-4 overflow-y-auto">
                    {selectedPlayer ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="text-4xl">{selectedPlayer.avatar}</div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">{selectedPlayer.name}</h2>
                                    <p className="text-sm text-slate-400">ID: {selectedPlayer.id}</p>
                                </div>
                            </div>

                            {/* Financial Actions */}
                            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><DollarSign size={14}/> Operações Financeiras</h3>
                                <div className="flex gap-2 mb-3">
                                    <input 
                                        type="text" 
                                        value={amountStr} 
                                        onChange={e => setAmountStr(formatInputCurrency(e.target.value))} 
                                        placeholder="Valor" 
                                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono font-bold outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button disabled={!parseInputCurrency(amountStr)} onClick={() => executeAction('admin_add_money', selectedPlayer.id, parseInputCurrency(amountStr))} className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold text-xs disabled:opacity-50">CREDITAR (+)</button>
                                    <button disabled={!parseInputCurrency(amountStr)} onClick={() => executeAction('admin_remove_money', selectedPlayer.id, parseInputCurrency(amountStr))} className="bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-bold text-xs disabled:opacity-50">DEBITAR (-)</button>
                                </div>
                            </div>

                            {/* Legal Actions */}
                            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Gavel size={14}/> Jurídico</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedPlayer.isJailed ? (
                                        <button onClick={() => executeAction('admin_unjail', selectedPlayer.id)} className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2"><Unlock size={16}/> SOLTAR</button>
                                    ) : (
                                        <button onClick={() => executeAction('admin_jail', selectedPlayer.id)} className="bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2"><Siren size={16}/> PRENDER</button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button onClick={() => executeAction('admin_freeze', selectedPlayer.id)} className="bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2"><Snowflake size={16}/> CONGELAR</button>
                                    <button onClick={() => { if(confirm("Expulsar jogador?")) executeAction('admin_kick', selectedPlayer.id); }} className="bg-red-700 hover:bg-red-600 text-white py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2"><Ban size={16}/> EXPULSAR</button>
                                </div>
                            </div>

                            {/* Inventory Actions */}
                            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Backpack size={14}/> Inventário</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(ITEM_NAMES).map(([id, name]) => (
                                        <button key={id} onClick={() => executeAction('admin_add_item', selectedPlayer.id, 0, id)} className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white py-2 rounded-lg font-bold text-[10px] border border-indigo-500/30 transition">DAR {name.toUpperCase()}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Assets Seizure */}
                            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><AlertTriangle size={14}/> Penhora de Bens</h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    {(selectedPlayer.properties || []).length === 0 ? <p className="text-xs text-slate-500 italic">Sem bens penhoráveis.</p> : (selectedPlayer.properties.map(pid => { const prop = PROPERTIES_DB.find(p => p.id === pid); return (<div key={pid} className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-700"><span className="text-xs font-bold text-slate-300">{prop.name}</span><button onClick={() => { if(confirm(`Penhorar ${prop.name}?`)) executeAction('admin_seize_prop', selectedPlayer.id, 0, '', pid); }} className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-[10px] font-bold hover:bg-red-500 hover:text-white transition">PENHORAR</button></div>); }))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <Users size={48} className="mb-4 opacity-20" />
                            <p className="text-sm">Selecione um cidadão para administrar.</p>
                        </div>
                    )}
                </div>
            </div>
            )}
        </div>
    );
};

export default CentralBankDashboard;