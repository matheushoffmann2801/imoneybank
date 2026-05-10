import React, { useState, useEffect } from 'react';
import { UserCheck, Key, Loader2, ChevronRight, Landmark, Lock, LogOut } from 'lucide-react';

const AuthScreen = ({ setUser, API_URL, onOpenAdmin }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login' ou 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Se já estiver logado (tem token e user), o App.jsx vai passar direto para MainMenu
    // Aqui não precisamos fazer nada automático, App.jsx gerencia
  }, []);

  const handleAuth = async (e) => {
      e.preventDefault();
      setErrorMsg('');
      if (!username || !password) return setErrorMsg('Preencha usuário e senha');
      setIsProcessing(true);
      
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      
      try {
          const res = await fetch(`${API_URL}${endpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
          });
          
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Erro de autenticação');
          
          localStorage.setItem('imoney_token', data.token);
          
          const userData = {
              uid: data.user.id,
              name: data.user.username,
              avatar: '👤|0' // Avatar padrão, pode ser alterado no MainMenu
          };
          localStorage.setItem('imoney_user', JSON.stringify(userData));
          
          setUser(userData);
          // O App.jsx vai detectar a mudança de user e ir para o MainMenu
      } catch (e) {
          setErrorMsg(e.message);
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen bg-black flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-emerald-500/30">
        <style>{`
            @keyframes pulse-glow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
            @keyframes gradient-xy { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            .animate-gradient { background-size: 200% 200%; animation: gradient-xy 6s ease infinite; }
            .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        `}</style>

        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-900/20 rounded-full blur-[120px] animate-[pulse-glow_8s_infinite]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-900/20 rounded-full blur-[120px] animate-[pulse-glow_10s_infinite_reverse]"></div>
        </div>

        <div className="relative z-10 w-full max-w-[360px] p-4">
            <div className="glass-panel rounded-[2.5rem] p-8 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] hover:border-white/10">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-400/30 transition-all duration-700 pointer-events-none"></div>
                
                <div className="flex flex-col items-center mb-8 relative">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-40 animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-emerald-400 to-teal-600 p-5 rounded-2xl shadow-2xl shadow-emerald-500/20 transform transition-transform duration-500 hover:rotate-12 hover:scale-110">
                            <Landmark size={40} className="text-white drop-shadow-md" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-center text-white mb-1 drop-shadow-lg">
                        iMoney <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Bank</span>
                    </h1>
                </div>

                <form onSubmit={handleAuth} className="space-y-5 relative animate-in fade-in">
                    <div className="flex gap-2 mb-6">
                        <button type="button" onClick={() => { setAuthMode('login'); setErrorMsg(''); }} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${authMode === 'login' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-500 hover:bg-white/5 border border-transparent'}`}>LOGIN</button>
                        <button type="button" onClick={() => { setAuthMode('register'); setErrorMsg(''); }} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${authMode === 'register' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-500 hover:bg-white/5 border border-transparent'}`}>CADASTRAR</button>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-xl text-xs text-center font-bold">
                            {errorMsg}
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="relative bg-black/40 border border-white/5 rounded-2xl p-1 flex items-center focus-within:border-emerald-500/50 focus-within:bg-black/60">
                            <div className="p-3 text-gray-400 focus-within:text-emerald-400"><UserCheck size={20} /></div>
                            <div className="flex-1">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 ml-1">Usuário</label>
                                <input value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-transparent text-white font-bold text-sm outline-none placeholder:text-gray-700 h-6" placeholder="Apelido" />
                            </div>
                        </div>

                        <div className="relative bg-black/40 border border-white/5 rounded-2xl p-1 flex items-center focus-within:border-emerald-500/50 focus-within:bg-black/60">
                            <div className="p-3 text-gray-400 focus-within:text-emerald-400"><Lock size={20} /></div>
                            <div className="flex-1">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 ml-1">Senha</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent text-white font-bold text-sm outline-none placeholder:text-gray-700 h-6" placeholder="••••••••" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={isProcessing} className="w-full relative group overflow-hidden rounded-2xl p-[1px] mt-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 animate-gradient opacity-80 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative bg-black/80 hover:bg-black/60 rounded-2xl py-4 px-6 flex items-center justify-center gap-3 transition-all group-active:scale-[0.98]">
                            {isProcessing ? <Loader2 className="animate-spin text-emerald-400" size={20} /> : <span className="font-black text-white tracking-wide text-sm">{authMode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}</span>}
                        </div>
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default AuthScreen;