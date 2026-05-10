import React, { useState, useEffect, useRef } from 'react';
import { UserCheck, Lock, Loader2, Landmark, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

const AuthScreen = ({ setUser, API_URL, onOpenAdmin }) => {
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);
  const formRef = useRef(null);

  useEffect(() => { setErrorMsg(''); }, [authMode]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim() || !password.trim()) return setErrorMsg('Preencha todos os campos');
    if (authMode === 'register' && password.length < 3) return setErrorMsg('Senha muito curta (mín. 3)');
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}${authMode === 'login' ? '/auth/login' : '/auth/register'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro de autenticação');
      localStorage.setItem('imoney_token', data.token);
      const userData = { uid: data.user.id, name: data.user.username, avatar: '👤|0' };
      localStorage.setItem('imoney_user', JSON.stringify(userData));
      setSuccessAnim(true);
      setTimeout(() => setUser(userData), 600);
    } catch (e) {
      setErrorMsg(e.message);
      formRef.current?.classList.add('shake-anim');
      setTimeout(() => formRef.current?.classList.remove('shake-anim'), 500);
    } finally { setIsProcessing(false); }
  };

  return (
    <div className={`fixed inset-0 h-[100dvh] w-screen flex items-center justify-center overflow-hidden font-sans transition-all duration-500 ${successAnim ? 'scale-105 opacity-0' : ''}`}
      style={{ background: '#09090b' }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        .shake-anim { animation: shake 0.4s ease; }
        @keyframes shake { 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(3px)} 30%,50%,70%{transform:translateX(-3px)} 40%,60%{transform:translateX(3px)} }
      `}</style>

      {/* BG */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[160px] -top-[200px] -left-[100px] bg-emerald-900/20" />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[140px] -bottom-[150px] -right-[80px] bg-indigo-900/15" />
      </div>

      <div className="relative z-10 w-full max-w-[380px] px-5 pt-safe-top" style={{ animation: 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
        <div ref={formRef} className="rounded-2xl p-6 sm:p-7" style={{
          background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)'
        }}>
          {/* Brand */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-4"
              style={{ transform: 'rotate(-6deg)' }}>
              <Landmark size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              iMoney <span className="text-emerald-400">Bank</span>
            </h1>
            <p className="text-[10px] text-gray-600 font-medium tracking-[0.25em] uppercase mt-0.5">Banco Digital</p>
          </div>

          {/* Mode Switch */}
          <div className="relative bg-white/[0.03] rounded-xl p-1 mb-5 border border-white/[0.04]">
            <div className="absolute top-1 bottom-1 rounded-lg transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                left: authMode === 'login' ? '4px' : '50%', width: 'calc(50% - 4px)',
                background: authMode === 'login' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                border: `1px solid ${authMode === 'login' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}`,
              }}
            />
            <div className="relative flex">
              {[{id:'login',label:'Entrar',icon:UserCheck,color:'emerald'},{id:'register',label:'Criar Conta',icon:Shield,color:'indigo'}].map(m => (
                <button key={m.id} type="button" onClick={() => setAuthMode(m.id)}
                  className={`flex-1 py-2 text-[11px] font-bold rounded-lg z-10 flex items-center justify-center gap-1.5 transition-colors ${authMode === m.id ? `text-${m.color}-400` : 'text-gray-600'}`}
                ><m.icon size={13} />{m.label}</button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-3">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/15 text-red-400 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2"
                style={{ animation: 'slideUp 0.2s ease' }}>
                <span className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center text-[10px] shrink-0">!</span>
                {errorMsg}
              </div>
            )}

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] focus-within:border-emerald-500/40 focus-within:bg-emerald-500/[0.02] transition-all">
              <div className="flex items-center px-3 gap-2">
                <UserCheck size={16} className="text-gray-600 shrink-0" />
                <input value={username} onChange={e => setUsername(e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm font-medium outline-none placeholder:text-gray-700 py-3 min-w-0"
                  placeholder="Usuário" autoComplete="username" maxLength={20} />
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] focus-within:border-emerald-500/40 focus-within:bg-emerald-500/[0.02] transition-all">
              <div className="flex items-center px-3 gap-2">
                <Lock size={16} className="text-gray-600 shrink-0" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm font-medium outline-none placeholder:text-gray-700 py-3 min-w-0"
                  placeholder="Senha" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-600 hover:text-gray-400 p-1" tabIndex={-1}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isProcessing}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 relative overflow-hidden"
              style={{
                background: authMode === 'login'
                  ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6366f1, #7c3aed)',
              }}>
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <><span>{authMode === 'login' ? 'Entrar' : 'Criar Conta'}</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-[10px] text-gray-700 mt-4 font-medium">
            {authMode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
            <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className={`font-bold ${authMode === 'login' ? 'text-emerald-500' : 'text-indigo-400'}`}
            >{authMode === 'login' ? 'Crie agora' : 'Faça login'}</button>
          </p>
        </div>
        <p className="text-center text-[9px] text-gray-800 mt-3 font-mono tracking-wider">v2.0 • iMoney Bank™</p>
      </div>
    </div>
  );
};

export default AuthScreen;