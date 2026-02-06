import React, { useState, useEffect } from 'react';
import { UserCheck, Key, Loader2, ChevronRight, Landmark, ShieldAlert, CreditCard, Wallet, Sparkles, Building } from 'lucide-react';
import { AvatarSelector } from './AvatarSelector';

const AuthScreen = ({ setUser, setActiveRoomId, enterFullScreen, API_URL, INITIAL_BALANCE, BANK_START_RESERVE, onOpenAdmin, playSound }) => {
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    // Pre-fill player name if already stored in localStorage
    try {
      const storedUser = localStorage.getItem('imoney_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.name) {
          setPlayerNameInput(parsedUser.name);
        }
        if (parsedUser.avatar) {
          setAvatarUrl(parsedUser.avatar);
        }
      }
    } catch (e) {
      console.error("Error parsing stored user for pre-fill:", e);
    }
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!playerNameInput.trim()) return alert("Digite um nome!");
    if (!roomCodeInput.trim()) return alert("Código inválido!");
    setIsJoining(true);
    const cleanRoom = roomCodeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    try {
      const storedUser = localStorage.getItem('imoney_user');
      let currentUser = JSON.parse(storedUser);

      // Update user's name in localStorage and App.jsx's state
      currentUser.name = playerNameInput.trim();
      currentUser.avatar = avatarUrl;
      localStorage.setItem('imoney_user', JSON.stringify(currentUser));
      setUser(currentUser); // Update App.jsx's user state

      // Fetch current room data
      const res = await fetch(`${API_URL}/room/${cleanRoom}`);
      const data = await res.json();

      let currentPlayers = data.players || {};
      if (!currentPlayers[currentUser.uid]) {
        currentPlayers[currentUser.uid] = {
          id: currentUser.uid,
          name: playerNameInput.trim(),
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
        };
      } else {
        // Update existing player's name if they rejoin
        currentPlayers[currentUser.uid].name = playerNameInput.trim();
        currentPlayers[currentUser.uid].avatar = avatarUrl;
      }

      const newState = {
        players: currentPlayers,
        bankReserve: data.bankReserve || BANK_START_RESERVE,
        transactions: data.transactions || [],
        offers: data.offers || [],
        gameStarted: data.gameStarted || false,
        restartVotes: data.restartVotes || [],
        winner: null
      };

      await fetch(`${API_URL}/room/${cleanRoom}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState)
      });

      setActiveRoomId(cleanRoom);
      localStorage.setItem('imoney_room_id', cleanRoom);
    } catch (e) {
      alert("Erro: " + e.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleAdminLogin = async (e) => {
      e.preventDefault();
      if (adminPassword !== '@Matheus6584') return alert("Acesso Negado");
      
      if (!roomCodeInput.trim()) return alert("Digite o código da sala para administrar!");
      const cleanRoom = roomCodeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

      // Set Admin User State
      const adminUser = { uid: 'ADMIN', name: 'Banco Central', avatar: '🏦' };
      setUser(adminUser);
      
      // Ensure room exists or create it
      try {
          const res = await fetch(`${API_URL}/room/${cleanRoom}`);
          const data = await res.json();
          if (!data || Object.keys(data).length === 0) {
               // Create room if not exists (Admin starting a room)
               await fetch(`${API_URL}/room/${cleanRoom}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ players: {}, bankReserve: BANK_START_RESERVE }) });
          }
          
          setActiveRoomId(cleanRoom);
          localStorage.setItem('imoney_room_id', cleanRoom);
          // Note: We don't save admin user to localStorage to prevent auto-login as admin on refresh for security/UX
      } catch (e) {
          alert("Erro ao conectar: " + e.message);
      }
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen bg-black flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-emerald-500/30">
        {/* CSS Animations */}
        <style>{`
            @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
            @keyframes pulse-glow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
            @keyframes gradient-xy { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            .animate-gradient { background-size: 200% 200%; animation: gradient-xy 6s ease infinite; }
            .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        `}</style>

        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-900/20 rounded-full blur-[120px] animate-[pulse-glow_8s_infinite]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-900/20 rounded-full blur-[120px] animate-[pulse-glow_10s_infinite_reverse]"></div>
            <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-teal-500/10 rounded-full blur-[100px] animate-pulse"></div>
        </div>

        {/* Main Card */}
        <div className="relative z-10 w-full max-w-[360px] p-4">
            <div className="glass-panel rounded-[2.5rem] p-8 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] hover:border-white/10">
                
                {/* Decorative Elements inside card */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-400/30 transition-all duration-700 pointer-events-none"></div>
                
                {/* Header */}
                <div className="flex flex-col items-center mb-10 relative">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-40 animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-emerald-400 to-teal-600 p-5 rounded-2xl shadow-2xl shadow-emerald-500/20 transform transition-transform duration-500 hover:rotate-12 hover:scale-110">
                            <Landmark size={40} className="text-white drop-shadow-md" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white text-emerald-600 p-1.5 rounded-lg shadow-lg rotate-12">
                            <Sparkles size={12} fill="currentColor" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-center text-white mb-1 drop-shadow-lg">
                        iMoney <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Bank</span>
                    </h1>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.4em] opacity-80">Ultimate Edition</p>
                </div>

                {showAdminLogin ? (
                    <form onSubmit={handleAdminLogin} className="space-y-5 relative animate-in fade-in slide-in-from-right">
                        <div className="text-center mb-4">
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2"><Building size={14}/> Acesso Banco Central</p>
                        </div>
                        <input
                            value={roomCodeInput}
                            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-emerald-500 text-center uppercase font-mono"
                            placeholder="CÓDIGO DA SALA"
                        />
                        <input
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-emerald-500 text-center"
                            placeholder="SENHA DE SEGURANÇA"
                        />
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition">ACESSAR SISTEMA</button>
                        <button type="button" onClick={() => setShowAdminLogin(false)} className="w-full text-xs text-gray-500 hover:text-white transition">Voltar</button>
                    </form>
                ) : (
                <form onSubmit={handleJoin} className="space-y-5 relative">
                    
                    {/* Avatar Selection */}
                    <AvatarSelector 
                        playerName={playerNameInput} 
                        onAvatarChange={setAvatarUrl} 
                        playSound={playSound}
                    />
                    
                    {/* Player Name Input */}
                    <div className={`relative group transition-all duration-300 ${focusedField === 'name' ? 'scale-[1.02]' : ''}`}>
                        <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur transition-opacity duration-300 ${focusedField === 'name' ? 'opacity-100' : 'opacity-0'}`}></div>
                        <div className="relative bg-black/40 border border-white/5 rounded-2xl p-1 flex items-center transition-colors group-hover:border-white/10 focus-within:border-emerald-500/50 focus-within:bg-black/60">
                            <div className="p-3 text-gray-400 group-focus-within:text-emerald-400 transition-colors">
                                <UserCheck size={20} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 ml-1">Seu Apelido</label>
                                <input
                                    value={playerNameInput}
                                    onChange={(e) => setPlayerNameInput(e.target.value)}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                    className="w-full bg-transparent text-white font-bold text-sm outline-none placeholder:text-gray-700 h-6"
                                    placeholder="Ex: Elon Musk"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Room Code Input */}
                    <div className={`relative group transition-all duration-300 ${focusedField === 'room' ? 'scale-[1.02]' : ''}`}>
                        <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur transition-opacity duration-300 ${focusedField === 'room' ? 'opacity-100' : 'opacity-0'}`}></div>
                        <div className="relative bg-black/40 border border-white/5 rounded-2xl p-1 flex items-center transition-colors group-hover:border-white/10 focus-within:border-indigo-500/50 focus-within:bg-black/60">
                            <div className="p-3 text-gray-400 group-focus-within:text-indigo-400 transition-colors">
                                <Key size={20} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 ml-1">Código da Sala</label>
                                <input
                                    value={roomCodeInput}
                                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                                    onFocus={() => setFocusedField('room')}
                                    onBlur={() => setFocusedField(null)}
                                    className="w-full bg-transparent text-white font-bold text-sm outline-none placeholder:text-gray-700 h-6 uppercase font-mono tracking-widest"
                                    placeholder="MESA1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isJoining}
                        className="w-full relative group overflow-hidden rounded-2xl p-[1px] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-black mt-6"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 animate-gradient opacity-80 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative bg-black/80 hover:bg-black/60 backdrop-blur-xl rounded-2xl py-4 px-6 flex items-center justify-center gap-3 transition-all group-active:scale-[0.98]">
                            {isJoining ? (
                                <Loader2 className="animate-spin text-emerald-400" size={20} />
                            ) : (
                                <>
                                    <span className="font-black text-white tracking-wide text-sm group-hover:text-emerald-100 transition-colors">ENTRAR NA MESA</span>
                                    <div className="bg-white/10 rounded-full p-1 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                        <ChevronRight size={14} />
                                    </div>
                                </>
                            )}
                        </div>
                    </button>
                </form>
                )}

                {/* Footer */}
                <div className="mt-8 flex items-center justify-center gap-4 opacity-30 hover:opacity-100 transition-opacity duration-500">
                    <div className="flex items-center gap-1.5">
                        <CreditCard size={12} className="text-gray-400"/>
                        <span className="text-[9px] font-mono text-gray-400">SECURE</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                    <div className="flex items-center gap-1.5">
                        <Wallet size={12} className="text-gray-400"/>
                        <span className="text-[9px] font-mono text-gray-400">FAST</span>
                    </div>
                </div>
            </div>
            
            <div className="text-center mt-6 space-y-1">
                <div className="flex justify-center gap-4">
                    <button onClick={onOpenAdmin} className="text-[10px] font-mono text-gray-600 tracking-[0.2em] uppercase hover:text-emerald-500 transition-colors cursor-pointer">Versão 2.2</button>
                    <button onClick={() => setShowAdminLogin(true)} className="text-[10px] font-mono text-gray-600 tracking-[0.2em] uppercase hover:text-emerald-500 transition-colors cursor-pointer flex items-center gap-1"><Building size={10}/> Banco Central</button>
                </div>
                <p className="text-[10px] text-gray-700 font-bold">Desenvolvido por Matheus Hoffmann</p>
            </div>
        </div>
    </div>
  );
};

export default AuthScreen;