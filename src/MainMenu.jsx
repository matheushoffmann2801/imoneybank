import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Search, Lock, Users, Loader2, Play, Building, Crown, X, Shield, ChevronRight, RefreshCw, Trash2, MoreVertical, Copy, CheckCheck, Gamepad2 } from 'lucide-react';
import { AvatarSelector, parseAvatar, AVATAR_COLORS_LIST } from './AvatarSelector';

const MainMenu = ({ user, setUser, setActiveRoomId, API_URL, INITIAL_BALANCE, BANK_START_RESERVE, onOpenAdmin, playSound }) => {
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '👤|0');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(null);
    const [showRoomMenu, setShowRoomMenu] = useState(null); // room code for context menu
    const [isProcessing, setIsProcessing] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomPassword, setNewRoomPassword] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);

    const fetchRooms = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true); else setLoadingRooms(true);
        try { const res = await fetch(`${API_URL}/rooms`); const data = await res.json(); if (res.ok) setRooms(data); }
        catch (e) { console.error("Erro ao buscar salas", e); }
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
        try {
            const res = await fetch(`${API_URL}/room/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, name: newRoomName, password: newRoomPassword || null, adminId: user.uid,
                    initialState: { players: { [user.uid]: getInitialPlayerState() }, bankReserve: BANK_START_RESERVE, adminId: user.uid } }) });
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

    const handleDeleteRoom = async (code) => {
        if (!confirm(`Tem certeza que deseja excluir a sala ${code}?`)) return;
        try {
            await fetch(`${API_URL}/room/${code}`, { method: 'DELETE' });
            setRooms(prev => prev.filter(r => r.code !== code));
            setShowRoomMenu(null);
        } catch (e) { console.error(e); }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const { emoji: userEmoji, colorIdx } = parseAvatar(avatarUrl);
    const userColor = AVATAR_COLORS_LIST[colorIdx] || AVATAR_COLORS_LIST[0];
    const myRooms = filteredRooms.filter(r => r.adminId === user.uid);
    const otherRooms = filteredRooms.filter(r => r.adminId !== user.uid);

    return (
        <div className="fixed inset-0 h-[100dvh] w-screen flex flex-col overflow-hidden font-sans" style={{ background: '#09090b' }}>
            <style>{`
                @keyframes fadeIn { from{opacity:0} to{opacity:1} }
                @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes cardIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                .room-card { animation: cardIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; }
                .custom-scrollbar::-webkit-scrollbar { width: 2px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 10px; }
            `}</style>

            {/* BG */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-[500px] h-[500px] rounded-full blur-[160px] -top-[200px] -left-[100px] bg-emerald-900/15" />
                <div className="absolute w-[400px] h-[400px] rounded-full blur-[140px] -bottom-[150px] -right-[80px] bg-indigo-900/10" />
            </div>

            {/* Header */}
            <div className="relative z-10 pt-safe-top px-4 pt-2 pb-1 shrink-0">
                <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <AvatarSelector playerName={user?.name || 'Jogador'} currentAvatar={avatarUrl}
                            onAvatarChange={handleAvatarChange} playSound={playSound} compact={true} />
                        <div className="min-w-0">
                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.15em]">Olá,</p>
                            <p className="text-sm font-bold text-white truncate max-w-[160px]">{user?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={onOpenAdmin} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-emerald-400 rounded-lg hover:bg-white/5 active:scale-90 transition-all" title="Banco Central">
                            <Building size={16} />
                        </button>
                        <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-red-400 rounded-lg hover:bg-white/5 active:scale-90 transition-all" title="Sair">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.04] mx-4" />

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col px-4 pb-4 min-h-0 pt-3">
                {/* Title + Actions */}
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Salas</h2>
                        <p className="text-[11px] text-gray-600">{rooms.length} {rooms.length === 1 ? 'disponível' : 'disponíveis'}</p>
                    </div>
                    <div className="flex gap-1.5">
                        <button onClick={() => fetchRooms(true)} className={`w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-gray-500 hover:text-white active:scale-90 transition-all ${refreshing ? 'animate-spin' : ''}`}>
                            <RefreshCw size={14} />
                        </button>
                        <button onClick={() => { setShowCreateModal(true); setErrorMsg(''); setNewRoomName(''); setNewRoomPassword(''); if(playSound) playSound('click'); }}
                            className="h-9 px-3 bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-lg shadow-emerald-600/20">
                            <Plus size={14} strokeWidth={3} /> Nova
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-3 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none" size={14} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder-gray-700 focus:outline-none focus:border-emerald-500/30 transition-all"
                        placeholder="Buscar sala..."
                    />
                </div>

                {/* Room List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 space-y-4 pb-2">
                    {loadingRooms ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                            <Loader2 className="animate-spin mb-2" size={22} />
                            <p className="text-xs">Buscando salas...</p>
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-44 text-center px-6">
                            <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-3">
                                <Gamepad2 size={24} className="text-gray-700" />
                            </div>
                            <p className="text-sm font-medium text-gray-500 mb-0.5">Nenhuma sala</p>
                            <p className="text-xs text-gray-700">Crie uma sala e convide amigos</p>
                        </div>
                    ) : (
                        <>
                            {/* My Rooms */}
                            {myRooms.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Crown size={11} className="text-amber-500" /> Minhas Salas
                                    </p>
                                    <div className="space-y-1.5">
                                        {myRooms.map((room, idx) => (
                                            <RoomCard key={room.code} room={room} idx={idx} isOwner={true}
                                                onJoin={() => { setShowJoinModal(room); setJoinPassword(''); setErrorMsg(''); if(playSound) playSound('click'); }}
                                                onMenu={() => setShowRoomMenu(showRoomMenu === room.code ? null : room.code)}
                                                showMenu={showRoomMenu === room.code}
                                                onDelete={() => handleDeleteRoom(room.code)}
                                                onCopy={() => handleCopyCode(room.code)}
                                                copied={copiedCode === room.code}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Other Rooms */}
                            {otherRooms.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Users size={11} /> {myRooms.length > 0 ? 'Outras Salas' : 'Salas Disponíveis'}
                                    </p>
                                    <div className="space-y-1.5">
                                        {otherRooms.map((room, idx) => (
                                            <RoomCard key={room.code} room={room} idx={idx} isOwner={false}
                                                onJoin={() => { setShowJoinModal(room); setJoinPassword(''); setErrorMsg(''); if(playSound) playSound('click'); }}
                                                onCopy={() => handleCopyCode(room.code)}
                                                copied={copiedCode === room.code}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* MODAL CRIAR SALA */}
            {showCreateModal && (
                <BottomSheet onClose={() => setShowCreateModal(false)}>
                    <form onSubmit={handleCreateRoom}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/15">
                                <Plus size={16} className="text-emerald-400" />
                            </div>
                            <h3 className="text-base font-bold text-white">Nova Sala</h3>
                        </div>

                        {errorMsg && <div className="bg-red-500/10 border border-red-500/15 text-red-400 px-3 py-2 rounded-lg text-xs mb-3 font-medium">{errorMsg}</div>}

                        <div className="space-y-3 mb-5">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nome</label>
                                <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} autoFocus maxLength={30}
                                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-emerald-500/30 transition-all placeholder:text-gray-700"
                                    placeholder="Ex: Mesa dos Amigos" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Senha <span className="text-gray-700 font-normal">(Opcional)</span></label>
                                <div className="relative">
                                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
                                    <input type="password" value={newRoomPassword} onChange={(e) => setNewRoomPassword(e.target.value)} maxLength={20}
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 pl-8 text-white text-sm outline-none focus:border-emerald-500/30 transition-all placeholder:text-gray-700"
                                        placeholder="Pública se vazio" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-lg font-bold text-gray-500 bg-white/[0.03] border border-white/[0.04] text-sm active:scale-95 transition">Cancelar</button>
                            <button type="submit" disabled={isProcessing}
                                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-bold text-sm flex justify-center items-center active:scale-95 transition disabled:opacity-50 shadow-lg shadow-emerald-600/20">
                                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : 'Criar'}
                            </button>
                        </div>
                    </form>
                </BottomSheet>
            )}

            {/* MODAL ENTRAR */}
            {showJoinModal && (
                <BottomSheet onClose={() => setShowJoinModal(null)}>
                    <form onSubmit={handleJoinRoom}>
                        <div className="text-center mb-5">
                            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 border border-emerald-500/10">
                                {showJoinModal.hasPassword ? <Lock size={22} className="text-emerald-400" /> : <Gamepad2 size={22} className="text-emerald-400" />}
                            </div>
                            <h3 className="text-base font-bold text-white mb-0.5">{showJoinModal.name}</h3>
                            <p className="text-xs text-gray-600 font-mono">#{showJoinModal.code} • {showJoinModal.playersCount} jogadores</p>
                        </div>

                        {errorMsg && <div className="bg-red-500/10 border border-red-500/15 text-red-400 px-3 py-2 rounded-lg text-xs mb-3 font-medium text-center">{errorMsg}</div>}

                        {showJoinModal.hasPassword && (
                            <div className="mb-5">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 text-center">Senha</label>
                                <input type="password" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} autoFocus
                                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-center text-white text-base tracking-[0.3em] font-bold outline-none focus:border-emerald-500/30 transition-all placeholder:text-gray-700 placeholder:tracking-normal placeholder:text-sm placeholder:font-normal"
                                    placeholder="Digite a senha" />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowJoinModal(null)} className="flex-1 py-2.5 rounded-lg font-bold text-gray-500 bg-white/[0.03] border border-white/[0.04] text-sm active:scale-95 transition">Cancelar</button>
                            <button type="submit" disabled={isProcessing}
                                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-bold text-sm flex justify-center items-center gap-1.5 active:scale-95 transition disabled:opacity-50 shadow-lg shadow-emerald-600/20">
                                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <><Play size={14} /> Entrar</>}
                            </button>
                        </div>
                    </form>
                </BottomSheet>
            )}
        </div>
    );
};

// --- Sub-components ---

const BottomSheet = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose} style={{ animation: 'fadeIn 0.15s ease' }}>
        <div onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-7 sm:pb-5"
            style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderBottom: 'none', animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 -8px 30px rgba(0,0,0,0.4)' }}>
            <div className="w-8 h-1 bg-white/8 rounded-full mx-auto mb-4 sm:hidden" />
            {children}
        </div>
    </div>
);

const RoomCard = ({ room, idx, isOwner, onJoin, onMenu, showMenu, onDelete, onCopy, copied }) => (
    <div className="room-card relative" style={{ animationDelay: `${idx * 50}ms` }}>
        <button onClick={onJoin}
            className="w-full text-left rounded-xl p-3 flex items-center gap-3 transition-all active:scale-[0.98] group"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            {/* Icon */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isOwner ? 'bg-amber-500/10 border border-amber-500/10' : 'bg-emerald-500/10 border border-emerald-500/10'}`}>
                {room.hasPassword ? <Lock size={15} className={isOwner ? "text-amber-400" : "text-emerald-400"} />
                    : <Users size={15} className={isOwner ? "text-amber-400" : "text-emerald-400"} />}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="text-sm font-semibold text-white truncate">{room.name}</h3>
                    {room.hasPassword && <Shield size={10} className="text-amber-500/50 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono">
                    <span className="flex items-center gap-0.5"><Users size={9} /> {room.playersCount}</span>
                    <span>#{room.code}</span>
                </div>
            </div>
            {/* Arrow */}
            <ChevronRight size={14} className="text-gray-700 group-hover:text-gray-400 transition shrink-0" />
        </button>

        {/* Actions row */}
        <div className="flex items-center gap-1 px-1 mt-1">
            <button onClick={(e) => { e.stopPropagation(); onCopy(); }}
                className="flex items-center gap-1 text-[9px] text-gray-700 hover:text-gray-400 transition px-1.5 py-0.5 rounded active:scale-90">
                {copied ? <><CheckCheck size={9} className="text-emerald-400" /> <span className="text-emerald-400">Copiado!</span></> : <><Copy size={9} /> Código</>}
            </button>
            {isOwner && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="flex items-center gap-1 text-[9px] text-gray-700 hover:text-red-400 transition px-1.5 py-0.5 rounded active:scale-90">
                    <Trash2 size={9} /> Excluir
                </button>
            )}
        </div>
    </div>
);

export default MainMenu;
