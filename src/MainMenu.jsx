import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Search, Lock, Users, ChevronRight, Loader2, Play, AlertCircle, Building } from 'lucide-react';
import { AvatarSelector } from './AvatarSelector';

const MainMenu = ({ user, setUser, setActiveRoomId, API_URL, INITIAL_BALANCE, BANK_START_RESERVE, onOpenAdmin, playSound }) => {
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '👤|0');
    
    // Modals state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(null); // armazena a sala selecionada para join
    const [isProcessing, setIsProcessing] = useState(false);

    // Form states
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomPassword, setNewRoomPassword] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const fetchRooms = async () => {
        setLoadingRooms(true);
        try {
            const res = await fetch(`${API_URL}/rooms`);
            const data = await res.json();
            if (res.ok) setRooms(data);
        } catch (e) {
            console.error("Erro ao buscar salas", e);
        } finally {
            setLoadingRooms(false);
        }
    };

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 10000); // Auto-refresh a cada 10s
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('imoney_token');
        localStorage.removeItem('imoney_user');
        setUser(null);
    };

    const handleAvatarChange = (newAvatar) => {
        setAvatarUrl(newAvatar);
        const currentUser = { ...user, avatar: newAvatar };
        localStorage.setItem('imoney_user', JSON.stringify(currentUser));
        setUser(currentUser);
    };

    const getInitialPlayerState = () => ({
        id: user.uid,
        name: user.name,
        avatar: avatarUrl,
        balance: INITIAL_BALANCE,
        savings: 0,
        debt: 0,
        assets: 0,
        properties: [],
        mortgaged: [],
        houses: {},
        isJailed: false,
        frozenTurns: 0,
        inventory: [],
        joinedAt: Date.now(),
        creditScore: 500
    });

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim()) return setErrorMsg('Nome da sala é obrigatório');
        setErrorMsg('');
        setIsProcessing(true);

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const initialState = {
            players: {
                [user.uid]: getInitialPlayerState()
            },
            bankReserve: BANK_START_RESERVE,
            adminId: user.uid
        };

        try {
            const res = await fetch(`${API_URL}/room/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    name: newRoomName,
                    password: newRoomPassword || null,
                    adminId: user.uid,
                    initialState
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao criar sala');

            setActiveRoomId(code);
            localStorage.setItem('imoney_room_id', code);
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsProcessing(true);

        const roomId = showJoinModal.code;

        try {
            const res = await fetch(`${API_URL}/room/${roomId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: joinPassword,
                    userId: user.uid,
                    playerState: getInitialPlayerState()
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao entrar na sala');

            setActiveRoomId(roomId);
            localStorage.setItem('imoney_room_id', roomId);
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.code.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="fixed inset-0 h-[100dvh] w-screen bg-black flex flex-col items-center justify-center overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-900/20 rounded-full blur-[120px] animate-[pulse-glow_8s_infinite]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-900/20 rounded-full blur-[120px] animate-[pulse-glow_10s_infinite_reverse]"></div>
            </div>

            <div className="relative z-10 w-full max-w-lg p-4 h-full flex flex-col pt-8 pb-4">
                {/* Header */}
                <div className="flex justify-between items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-4 shadow-xl">
                    <div className="flex items-center gap-3">
                        <AvatarSelector 
                            playerName={user?.name || 'Jogador'} 
                            currentAvatar={avatarUrl}
                            onAvatarChange={handleAvatarChange} 
                            playSound={playSound}
                        />
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Bem-vindo(a)</p>
                            <p className="text-lg font-bold text-white leading-tight">{user?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onOpenAdmin} className="p-2 text-gray-500 hover:text-emerald-400 transition bg-white/5 rounded-xl hover:bg-white/10" title="Banco Central">
                            <Building size={18} />
                        </button>
                        <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-400 transition bg-white/5 rounded-xl hover:bg-white/10" title="Sair">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col overflow-hidden shadow-2xl relative">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Salas de Jogo</h2>
                            <p className="text-sm text-gray-400">Encontre uma sala ou crie a sua</p>
                        </div>
                        <button 
                            onClick={() => { setShowCreateModal(true); setErrorMsg(''); setNewRoomName(''); setNewRoomPassword(''); }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Plus size={18} strokeWidth={3} />
                            <span className="hidden sm:inline">Criar Sala</span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="text-gray-500" size={18} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-black/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm"
                            placeholder="Buscar por nome ou código..."
                        />
                    </div>

                    {/* Room List */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {loadingRooms ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                                <Loader2 className="animate-spin mb-2" size={24} />
                                <p className="text-sm">Buscando salas...</p>
                            </div>
                        ) : filteredRooms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-center">
                                <AlertCircle size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">Nenhuma sala encontrada.<br/>Que tal criar a primeira?</p>
                            </div>
                        ) : (
                            filteredRooms.map(room => (
                                <button
                                    key={room.code}
                                    onClick={() => {
                                        setShowJoinModal(room);
                                        setJoinPassword('');
                                        setErrorMsg('');
                                    }}
                                    className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-4 transition-all group flex items-center justify-between"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-bold text-white truncate">{room.name}</h3>
                                            {room.hasPassword && <Lock size={14} className="text-emerald-400 shrink-0" />}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-mono text-gray-500 uppercase">
                                            <span className="flex items-center gap-1"><Users size={12}/> {room.playersCount}</span>
                                            <span>MESA: {room.code}</span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0 ml-4">
                                        <Play size={16} className="ml-1" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL CRIAR SALA */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleCreateRoom} className="bg-gray-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
                        <h3 className="text-xl font-bold text-white mb-4">Nova Sala</h3>
                        
                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-4">
                                {errorMsg}
                            </div>
                        )}

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nome da Sala</label>
                                <input
                                    type="text"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="Ex: Mesa dos Amigos"
                                    autoFocus
                                    maxLength={30}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Senha <span className="text-gray-600 font-normal">(Opcional)</span></label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="password"
                                        value={newRoomPassword}
                                        onChange={(e) => setNewRoomPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-10 text-white outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="Deixe em branco para sala pública"
                                        maxLength={20}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition">Cancelar</button>
                            <button type="submit" disabled={isProcessing} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center">
                                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : 'Criar Sala'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL ENTRAR NA SALA */}
            {showJoinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleJoinRoom} className="bg-gray-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400">
                                {showJoinModal.hasPassword ? <Lock size={28} /> : <Users size={28} />}
                            </div>
                            <h3 className="text-xl font-bold text-white leading-tight">{showJoinModal.name}</h3>
                            <p className="text-sm text-gray-500">Mesa: {showJoinModal.code} • {showJoinModal.playersCount} jogando</p>
                        </div>
                        
                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-4 text-center">
                                {errorMsg}
                            </div>
                        )}

                        {showJoinModal.hasPassword && (
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 text-center">Digite a Senha da Sala</label>
                                <input
                                    type="password"
                                    value={joinPassword}
                                    onChange={(e) => setJoinPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-center text-white outline-none focus:border-emerald-500 transition-colors text-lg tracking-widest"
                                    placeholder="••••••••"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowJoinModal(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition">Cancelar</button>
                            <button type="submit" disabled={isProcessing} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center">
                                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MainMenu;
