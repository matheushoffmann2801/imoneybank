import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, Plus, Search, Lock, Users, Loader2, Play, AlertCircle, Building, Crown, Gamepad2, Sparkles, X, Shield, ChevronRight, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { AvatarSelector, parseAvatar, AVATAR_COLORS_LIST } from './AvatarSelector';

const MainMenu = ({ user, setUser, setActiveRoomId, API_URL, INITIAL_BALANCE, BANK_START_RESERVE, onOpenAdmin, playSound }) => {
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '👤|0');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomPassword, setNewRoomPassword] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchRooms = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoadingRooms(true);
        try {
            const res = await fetch(`${API_URL}/rooms`);
            const data = await res.json();
            if (res.ok) setRooms(data);
        } catch (e) { console.error("Erro ao buscar salas", e); }
        finally { setLoadingRooms(false); setRefreshing(false); }
    };

    useEffect(() => { fetchRooms(); const i = setInterval(() => fetchRooms(), 10000); return () => clearInterval(i); }, []);

    const handleLogout = () => { localStorage.removeItem('imoney_token'); localStorage.removeItem('imoney_user'); setUser(null); };

    const handleAvatarChange = (newAvatar) => {
        setAvatarUrl(newAvatar);
        const currentUser = { ...user, avatar: newAvatar };
        localStorage.setItem('imoney_user', JSON.stringify(currentUser));
        setUser(currentUser);
    };

    const getInitialPlayerState = () => ({
        id: user.uid, name: user.name, avatar: avatarUrl, balance: INITIAL_BALANCE, savings: 0, debt: 0, assets: 0,
        properties: [], mortgaged: [], houses: {}, isJailed: false, frozenTurns: 0, inventory: [], joinedAt: Date.now(), creditScore: 500
    });

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim()) return setErrorMsg('Nome da sala é obrigatório');
        setErrorMsg(''); setIsProcessing(true);
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const initialState = { players: { [user.uid]: getInitialPlayerState() }, bankReserve: BANK_START_RESERVE, adminId: user.uid };
        try {
            const res = await fetch(`${API_URL}/room/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, name: newRoomName, password: newRoomPassword || null, adminId: user.uid, initialState }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao criar sala');
            setActiveRoomId(code); localStorage.setItem('imoney_room_id', code);
        } catch (err) { setErrorMsg(err.message); } finally { setIsProcessing(false); }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault(); setErrorMsg(''); setIsProcessing(true);
        const roomId = showJoinModal.code;
        try {
            const res = await fetch(`${API_URL}/room/${roomId}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: joinPassword, userId: user.uid, playerState: getInitialPlayerState() }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao entrar na sala');
            setActiveRoomId(roomId); localStorage.setItem('imoney_room_id', roomId);
        } catch (err) { setErrorMsg(err.message); } finally { setIsProcessing(false); }
    };

    const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const { emoji: userEmoji, colorIdx } = parseAvatar(avatarUrl);
    const userColor = AVATAR_COLORS_LIST[colorIdx] || AVATAR_COLORS_LIST[0];

    return (
        <div className="fixed inset-0 h-[100dvh] w-screen flex flex-col overflow-hidden font-sans" style={{ background: 'linear-gradient(145deg, #0a0b0f 0%, #0d1117 50%, #0a0f14 100%)' }}>
            <style>{`
                @keyframes pulse-glow { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.1)} }
                @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                @keyframes fadeIn { from{opacity:0} to{opacity:1} }
                @keyframes cardEnter { from{opacity:0;transform:translateY(12px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
                @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                @keyframes ripple { 0%{transform:scale(0.8);opacity:0.5} 100%{transform:scale(2.5);opacity:0} }
                .room-card { animation: cardEnter 0.5s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; }
                .room-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(16,185,129,0.08); }
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
                .modal-overlay { animation: fadeIn 0.2s ease; }
                .modal-content { animation: slideUp 0.35s cubic-bezier(0.16,1,0.3,1); }
            `}</style>

            {/* BG Orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[120px]" style={{animation:'pulse-glow 8s infinite'}} />
                <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] bg-indigo-600/8 rounded-full blur-[120px]" style={{animation:'pulse-glow 10s infinite reverse'}} />
                <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage:'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)',backgroundSize:'32px 32px'}} />
            </div>

            {/* === HEADER === */}
            <div className="relative z-10 pt-safe-top px-4 pt-3 pb-2 shrink-0">
                <div className="flex justify-between items-center rounded-2xl p-3 sm:p-4" style={{background:'rgba(255,255,255,0.03)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',boxShadow:'0 8px 32px rgba(0,0,0,0.3)'}}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-xl ${userColor.bg} flex items-center justify-center shadow-lg shrink-0 ring-2 ${userColor.ring}/20`}>
                            <span className="text-2xl select-none drop-shadow">{userEmoji}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] text-emerald-400/60 font-bold uppercase tracking-[0.2em]">Bem-vindo</p>
                            <p className="text-sm font-bold text-white truncate max-w-[140px]">{user?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button onClick={onOpenAdmin} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-emerald-400 transition-all rounded-xl hover:bg-white/5 active:scale-90" title="Banco Central">
                            <Building size={16} />
                        </button>
                        <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-red-400 transition-all rounded-xl hover:bg-white/5 active:scale-90" title="Sair">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* === MAIN CONTENT === */}
            <div className="relative z-10 flex-1 flex flex-col px-4 pb-4 min-h-0">
                {/* Title Row */}
                <div className="flex justify-between items-end mb-4 mt-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Gamepad2 size={20} className="text-emerald-400" />
                            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Salas</h2>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{rooms.length} {rooms.length === 1 ? 'sala ativa' : 'salas ativas'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => fetchRooms(true)} className={`w-10 h-10 flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/5 transition-all active:scale-90 ${refreshing ? 'animate-spin' : ''}`}>
                            <RefreshCw size={16} />
                        </button>
                        <button onClick={() => { setShowCreateModal(true); setErrorMsg(''); setNewRoomName(''); setNewRoomPassword(''); if(playSound) playSound('click'); }}
                            className="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 flex items-center gap-2 text-xs"
                        >
                            <Plus size={16} strokeWidth={3} />
                            <span className="hidden sm:inline">Nova Sala</span>
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-4 shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={16} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.06)] transition-all font-medium"
                        placeholder="Buscar por nome ou código..."
                    />
                </div>

                {/* Room List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar min-h-0 pb-2">
                    {loadingRooms ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                            <Loader2 className="animate-spin mb-3" size={28} />
                            <p className="text-sm font-medium">Buscando salas...</p>
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-52 text-gray-600 text-center px-8">
                            <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-4" style={{animation:'float 3s ease-in-out infinite'}}>
                                <Gamepad2 size={32} className="text-gray-700" />
                            </div>
                            <p className="text-sm font-semibold text-gray-500 mb-1">Nenhuma sala encontrada</p>
                            <p className="text-xs text-gray-700">Crie uma nova sala e convide seus amigos!</p>
                        </div>
                    ) : (
                        filteredRooms.map((room, idx) => (
                            <button key={room.code} onClick={() => { setShowJoinModal(room); setJoinPassword(''); setErrorMsg(''); if(playSound) playSound('click'); }}
                                className="room-card w-full text-left rounded-2xl p-4 transition-all duration-300 group flex items-center gap-4 active:scale-[0.98]"
                                style={{
                                    animationDelay: `${idx * 0.06}s`,
                                    background: 'rgba(255,255,255,0.025)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                {/* Room Icon */}
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center shrink-0 border border-emerald-500/10 group-hover:border-emerald-500/30 transition-colors relative overflow-hidden">
                                    {room.hasPassword ? <Lock size={18} className="text-emerald-400 relative z-10" /> : <Users size={18} className="text-emerald-400 relative z-10" />}
                                    <div className="absolute inset-0 bg-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Room Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">{room.name}</h3>
                                        {room.hasPassword && <Shield size={11} className="text-amber-400/60 shrink-0" />}
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-mono text-gray-600 uppercase">
                                        <span className="flex items-center gap-1"><Users size={10} /> {room.playersCount} jogadores</span>
                                        <span className="text-gray-700">•</span>
                                        <span>#{room.code}</span>
                                    </div>
                                </div>

                                {/* Join arrow */}
                                <div className="w-8 h-8 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 flex items-center justify-center transition-all duration-300 shrink-0 border border-transparent group-hover:border-emerald-400">
                                    <ChevronRight size={16} className="text-gray-700 group-hover:text-white transition-colors" />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* === MODAL CRIAR SALA === */}
            {showCreateModal && (
                <div className="modal-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
                    <form onSubmit={handleCreateRoom} onClick={e => e.stopPropagation()}
                        className="modal-content w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:pb-6 relative"
                        style={{background:'linear-gradient(145deg, #13151a, #0d0f14)',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 -20px 60px rgba(0,0,0,0.5)'}}
                    >
                        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5 sm:hidden" />
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
                                    <Plus size={18} className="text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Nova Sala</h3>
                            </div>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                                <X size={14} />
                            </button>
                        </div>

                        {errorMsg && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4 font-semibold">{errorMsg}</div>}

                        <div className="space-y-3 mb-5">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nome da Mesa</label>
                                <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} autoFocus maxLength={30}
                                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-white outline-none focus:border-emerald-500/40 transition-all text-sm font-medium placeholder:text-gray-700"
                                    placeholder="Ex: Mesa dos Amigos"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Senha <span className="text-gray-700 font-normal">(Opcional)</span></label>
                                <div className="relative">
                                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                                    <input type="password" value={newRoomPassword} onChange={(e) => setNewRoomPassword(e.target.value)} maxLength={20}
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 pl-9 text-white outline-none focus:border-emerald-500/40 transition-all text-sm font-medium placeholder:text-gray-700"
                                        placeholder="Sala pública se vazio"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2.5">
                            <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] transition-all active:scale-95 text-sm">Cancelar</button>
                            <button type="submit" disabled={isProcessing}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex justify-center items-center transition-all active:scale-95 disabled:opacity-60 text-sm"
                            >{isProcessing ? <Loader2 className="animate-spin" size={18} /> : 'Criar Sala'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* === MODAL ENTRAR NA SALA === */}
            {showJoinModal && (
                <div className="modal-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowJoinModal(null)}>
                    <form onSubmit={handleJoinRoom} onClick={e => e.stopPropagation()}
                        className="modal-content w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:pb-6 relative"
                        style={{background:'linear-gradient(145deg, #13151a, #0d0f14)',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 -20px 60px rgba(0,0,0,0.5)'}}
                    >
                        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5 sm:hidden" />
                        <div className="text-center mb-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center mx-auto mb-3 border border-emerald-500/15 shadow-lg shadow-emerald-500/5">
                                {showJoinModal.hasPassword ? <Lock size={24} className="text-emerald-400" /> : <Gamepad2 size={24} className="text-emerald-400" />}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{showJoinModal.name}</h3>
                            <p className="text-xs text-gray-500 font-mono">#{showJoinModal.code} • {showJoinModal.playersCount} jogadores</p>
                        </div>

                        {errorMsg && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4 font-semibold text-center">{errorMsg}</div>}

                        {showJoinModal.hasPassword && (
                            <div className="mb-5">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-center">Senha da Sala</label>
                                <input type="password" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} autoFocus
                                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center text-white outline-none focus:border-emerald-500/40 transition-all text-lg tracking-[0.3em] font-bold placeholder:text-gray-700 placeholder:tracking-[0.2em] placeholder:text-sm"
                                    placeholder="••••••"
                                />
                            </div>
                        )}

                        <div className="flex gap-2.5">
                            <button type="button" onClick={() => setShowJoinModal(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] transition-all active:scale-95 text-sm">Cancelar</button>
                            <button type="submit" disabled={isProcessing}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-60 text-sm"
                            >{isProcessing ? <Loader2 className="animate-spin" size={18} /> : <><Play size={16} className="ml-0.5" /> Entrar</>}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MainMenu;
