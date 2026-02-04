import React, { useState } from 'react';
import CompactModal from './CompactModal';
import { ShieldAlert, Trash2, DollarSign, Database, Server, Users, Save, X, LogOut, RefreshCw, Edit3 } from 'lucide-react';
import { formatCurrency, formatInputCurrency, parseInputCurrency } from './utils';

const AdminModal = ({ onClose, onResetServer, onResetRoom, onAddMoney, activeRoomId, API_URL, roomData, players }) => {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [editAmount, setEditAmount] = useState('');

    const handleLogin = () => {
        if (password === '@Matheus6584') {
            setIsAuthenticated(true);
        } else {
            alert('Senha incorreta');
        }
    };

    const handleUpdateBalance = async () => {
        if (!editingPlayer) return;
        const newBalance = parseInputCurrency(editAmount);
        
        // Atualiza localmente o objeto players para enviar ao servidor
        const updatedPlayers = { ...players };
        if (updatedPlayers[editingPlayer.id]) {
            updatedPlayers[editingPlayer.id].balance = newBalance;
        }

        try {
            // Usa o endpoint genérico de atualização da sala
            await fetch(`${API_URL}/room/${activeRoomId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players: updatedPlayers })
            });
            setEditingPlayer(null);
        } catch (e) {
            alert('Erro ao atualizar saldo');
        }
    };

    const handleKickPlayer = async (playerId) => {
        if (!window.confirm("Tem certeza que deseja remover este jogador da sala?")) return;
        
        const updatedPlayers = { ...players };
        delete updatedPlayers[playerId];

        try {
            await fetch(`${API_URL}/room/${activeRoomId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players: updatedPlayers })
            });
        } catch (e) {
            alert('Erro ao remover jogador');
        }
    };

    if (!isAuthenticated) {
        return (
            <CompactModal title="Acesso Administrativo" onClose={onClose}>
                <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                        <ShieldAlert className="mx-auto text-red-500 mb-2" size={32} />
                        <p className="text-xs text-red-600 font-bold uppercase">Área Restrita</p>
                    </div>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Senha Master" 
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-red-500 transition"
                    />
                    <button onClick={handleLogin} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition">ACESSAR</button>
                </div>
            </CompactModal>
        );
    }

    return (
        <CompactModal title="Painel Admin" onClose={onClose}>
            <div className="flex gap-2 mb-4 border-b border-gray-100 pb-2">
                <button onClick={() => setActiveTab('general')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'general' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-50'}`}>GERAL</button>
                <button onClick={() => setActiveTab('players')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'players' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-50'}`}>JOGADORES</button>
                <button onClick={() => setActiveTab('debug')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'debug' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-50'}`}>DEBUG</button>
            </div>

            {activeTab === 'general' && (
                <div className="space-y-3 animate-in fade-in">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-2 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Sala Atual</p>
                            <p className="font-mono font-bold text-gray-800">{activeRoomId}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Reserva Banco</p>
                            <p className="font-mono font-bold text-emerald-600">{formatCurrency(roomData.bankReserve)}</p>
                        </div>
                    </div>

                    <button onClick={() => onAddMoney(1000000)} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition">
                        <DollarSign size={18}/> ADICIONAR $1M (PARA MIM)
                    </button>

                    <hr className="border-gray-100 my-2"/>

                    <button onClick={onResetRoom} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition">
                        <Trash2 size={18}/> APAGAR SALA ATUAL
                    </button>

                    <button onClick={onResetServer} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition">
                        <Server size={18}/> RESETAR SERVIDOR (GLOBAL)
                    </button>
                </div>
            )}

            {activeTab === 'players' && (
                <div className="space-y-2 animate-in fade-in">
                    {editingPlayer ? (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-xs font-bold text-blue-800 uppercase">Editando: {editingPlayer.name}</p>
                                <button onClick={() => setEditingPlayer(null)}><X size={16} className="text-blue-400"/></button>
                            </div>
                            <p className="text-[10px] text-gray-500 mb-1">Novo Saldo</p>
                            <input 
                                type="text" 
                                value={editAmount} 
                                onChange={(e) => setEditAmount(formatInputCurrency(e.target.value))}
                                className="w-full p-2 border border-blue-200 rounded-lg text-lg font-bold text-gray-800 mb-3"
                                autoFocus
                            />
                            <button onClick={handleUpdateBalance} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-xs shadow-sm active:scale-95">SALVAR ALTERAÇÃO</button>
                        </div>
                    ) : (
                        Object.values(players).map(p => (
                            <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg">{p.avatar || '👤'}</div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">{p.name}</p>
                                        <p className="text-[10px] font-mono text-emerald-600">{formatCurrency(p.balance)}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingPlayer(p); setEditAmount(formatInputCurrency(p.balance.toString())); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"><Edit3 size={14}/></button>
                                    <button onClick={() => handleKickPlayer(p.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"><LogOut size={14}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'debug' && (
                <div className="animate-in fade-in h-64 flex flex-col">
                    <p className="text-xs font-bold mb-2 text-gray-500 flex items-center gap-2"><Database size={14}/> Dados Brutos da Sala</p>
                    <textarea readOnly value={JSON.stringify(roomData, null, 2)} className="flex-1 w-full text-[10px] font-mono bg-gray-900 text-green-400 p-3 rounded-xl border border-gray-700 resize-none focus:outline-none custom-scrollbar" />
                </div>
            )}
        </CompactModal>
    );
};

export default AdminModal;
