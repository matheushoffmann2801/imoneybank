import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserCheck, Lock, Loader2, Landmark, Eye, EyeOff, ArrowRight, Sparkles, Shield } from 'lucide-react';

// Floating coin particle component
const FloatingCoin = ({ delay, duration, left, size, emoji }) => (
  <div
    className="absolute pointer-events-none select-none"
    style={{
      left: `${left}%`,
      bottom: '-10%',
      fontSize: `${size}px`,
      animation: `floatUp ${duration}s ${delay}s ease-in-out infinite`,
      opacity: 0,
      filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.3))',
    }}
  >
    {emoji}
  </div>
);

const AuthScreen = ({ setUser, API_URL, onOpenAdmin }) => {
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const formRef = useRef(null);

  // Generate particles once
  const particles = useMemo(() => {
    const emojis = ['💰', '🪙', '💎', '💵', '🏦', '💳', '📈', '🤑', '✨', '⭐'];
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      delay: Math.random() * 12,
      duration: 8 + Math.random() * 10,
      left: Math.random() * 100,
      size: 16 + Math.random() * 20,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
  }, []);

  useEffect(() => {
    // Clear errors when switching modes
    setErrorMsg('');
  }, [authMode]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim() || !password.trim()) return setErrorMsg('Preencha todos os campos');
    if (authMode === 'register' && password.length < 3) return setErrorMsg('Senha muito curta (mín. 3)');
    setIsProcessing(true);

    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro de autenticação');

      localStorage.setItem('imoney_token', data.token);

      const userData = {
        uid: data.user.id,
        name: data.user.username,
        avatar: '👤|0',
      };
      localStorage.setItem('imoney_user', JSON.stringify(userData));

      // Success animation before navigating
      setSuccessAnim(true);
      setTimeout(() => setUser(userData), 800);
    } catch (e) {
      setErrorMsg(e.message);
      // Shake the form
      if (formRef.current) {
        formRef.current.classList.add('shake-error');
        setTimeout(() => formRef.current?.classList.remove('shake-error'), 600);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`fixed inset-0 h-[100dvh] w-screen flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-emerald-500/30 transition-all duration-700 ${successAnim ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}>
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg) scale(0.5); opacity: 0; }
          10% { opacity: 0.7; transform: translateY(-10vh) rotate(15deg) scale(1); }
          90% { opacity: 0.4; }
          100% { transform: translateY(-110vh) rotate(360deg) scale(0.3); opacity: 0; }
        }
        @keyframes pulse-glow { 
          0%, 100% { opacity: 0.4; transform: scale(1); } 
          50% { opacity: 0.7; transform: scale(1.15); } 
        }
        @keyframes gradient-xy { 
          0% { background-position: 0% 50%; } 
          50% { background-position: 100% 50%; } 
          100% { background-position: 0% 50%; } 
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-6px) rotate(-3deg); }
          75% { transform: translateY(4px) rotate(3deg); }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(16,185,129,0.1); box-shadow: 0 0 20px rgba(16,185,129,0.05); }
          50% { border-color: rgba(16,185,129,0.3); box-shadow: 0 0 40px rgba(16,185,129,0.15); }
        }
        .shake-error {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .auth-card {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }
        .brand-icon {
          animation: fadeInScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, iconFloat 4s ease-in-out 1s infinite;
          animation-delay: 0s, 0.8s;
          opacity: 0;
        }
        .mode-switch { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .input-focus-glow { transition: all 0.3s ease; }
        .input-focus-glow:focus-within { 
          border-color: rgba(16,185,129,0.5);
          box-shadow: 0 0 0 4px rgba(16,185,129,0.08), 0 0 20px rgba(16,185,129,0.1);
        }
        .submit-btn {
          background-size: 200% 200%;
          animation: gradient-xy 3s ease infinite;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(16,185,129,0.4); }
        .submit-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
      `}</style>

      {/* === MULTI-LAYER BACKGROUND === */}
      <div className="absolute inset-0 bg-[#0a0b0f]">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        {/* Radial gradient overlays */}
        <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-emerald-600/15 rounded-full blur-[150px]" style={{ animation: 'pulse-glow 8s ease-in-out infinite' }} />
        <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/10 rounded-full blur-[150px]" style={{ animation: 'pulse-glow 10s ease-in-out infinite reverse' }} />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[40%] h-[40%] bg-teal-500/8 rounded-full blur-[100px]" style={{ animation: 'pulse-glow 6s ease-in-out 2s infinite' }} />
      </div>

      {/* === FLOATING PARTICLES === */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        {particles.map(p => (
          <FloatingCoin key={p.id} {...p} />
        ))}
      </div>

      {/* === MAIN CARD === */}
      <div className="relative z-10 w-full max-w-[400px] px-5 pt-safe-top">
        <div
          ref={formRef}
          className="auth-card rounded-[2rem] p-7 sm:p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            animation: 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, borderGlow 4s ease-in-out infinite',
            animationDelay: '0.2s, 0s',
            opacity: 0,
          }}
        >
          {/* Shimmer stripe */}
          <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
            <div className="absolute inset-0 opacity-[0.04]" style={{ animation: 'shimmer 4s ease-in-out infinite' }}>
              <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white to-transparent" />
            </div>
          </div>

          {/* === BRAND HEADER === */}
          <div className="flex flex-col items-center mb-7 relative">
            <div className="brand-icon relative mb-5">
              <div className="absolute inset-[-8px] bg-emerald-500/30 blur-2xl rounded-full" />
              <div className="relative w-[72px] h-[72px] bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 rounded-[1.25rem] shadow-2xl shadow-emerald-500/30 flex items-center justify-center" style={{ transform: 'rotate(-6deg)' }}>
                <Landmark size={36} className="text-white drop-shadow-lg" strokeWidth={2.5} />
              </div>
              {/* Sparkle badges */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/30" style={{ animation: 'fadeInScale 0.5s ease 0.6s forwards', opacity: 0 }}>
                <Sparkles size={12} className="text-yellow-900" />
              </div>
            </div>
            <h1 className="text-[2rem] font-black tracking-tight text-center text-white mb-1 leading-none">
              iMoney<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400" style={{ backgroundSize: '200% auto', animation: 'gradient-xy 4s linear infinite' }}> Bank</span>
            </h1>
            <p className="text-[11px] text-gray-500 font-medium tracking-[0.3em] uppercase">Sistema Bancário Digital</p>
          </div>

          {/* === MODE SWITCH === */}
          <div className="relative bg-white/[0.03] rounded-2xl p-1 mb-6 border border-white/[0.04]">
            {/* Sliding indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                left: authMode === 'login' ? '4px' : '50%',
                width: 'calc(50% - 4px)',
                background: authMode === 'login'
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(20,184,166,0.15))'
                  : 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
                border: `1px solid ${authMode === 'login' ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`,
                boxShadow: authMode === 'login'
                  ? '0 0 20px rgba(16,185,129,0.1)'
                  : '0 0 20px rgba(99,102,241,0.1)',
              }}
            />
            <div className="relative flex">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors duration-300 z-10 flex items-center justify-center gap-1.5 ${
                  authMode === 'login' ? 'text-emerald-400' : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                <UserCheck size={14} />
                ENTRAR
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors duration-300 z-10 flex items-center justify-center gap-1.5 ${
                  authMode === 'register' ? 'text-indigo-400' : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                <Shield size={14} />
                CRIAR CONTA
              </button>
            </div>
          </div>

          {/* === FORM === */}
          <form onSubmit={handleAuth} className="space-y-4 relative">
            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold" style={{ animation: 'slideUp 0.3s ease' }}>
                <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">!</div>
                {errorMsg}
              </div>
            )}

            {/* Username Input */}
            <div className={`input-focus-glow relative rounded-2xl border transition-all duration-300 ${focusedField === 'user' ? 'border-emerald-500/50 bg-emerald-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
              <div className="flex items-center p-1">
                <div className={`p-3 transition-colors duration-300 ${focusedField === 'user' ? 'text-emerald-400' : 'text-gray-600'}`}>
                  <UserCheck size={18} />
                </div>
                <div className="flex-1 pr-3">
                  <label className={`block text-[9px] font-bold uppercase tracking-[0.15em] mb-0.5 transition-colors duration-300 ${focusedField === 'user' ? 'text-emerald-400/70' : 'text-gray-600'}`}>
                    Usuário
                  </label>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('user')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent text-white font-semibold text-sm outline-none placeholder:text-gray-700 h-6"
                    placeholder="Seu apelido"
                    autoComplete="username"
                    maxLength={20}
                  />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className={`input-focus-glow relative rounded-2xl border transition-all duration-300 ${focusedField === 'pass' ? 'border-emerald-500/50 bg-emerald-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
              <div className="flex items-center p-1">
                <div className={`p-3 transition-colors duration-300 ${focusedField === 'pass' ? 'text-emerald-400' : 'text-gray-600'}`}>
                  <Lock size={18} />
                </div>
                <div className="flex-1">
                  <label className={`block text-[9px] font-bold uppercase tracking-[0.15em] mb-0.5 transition-colors duration-300 ${focusedField === 'pass' ? 'text-emerald-400/70' : 'text-gray-600'}`}>
                    Senha
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('pass')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent text-white font-semibold text-sm outline-none placeholder:text-gray-700 h-6"
                    placeholder="••••••••"
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-3 text-gray-600 hover:text-gray-400 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="submit-btn w-full relative overflow-hidden rounded-2xl py-4 px-6 mt-2 flex items-center justify-center gap-3 font-black text-sm tracking-wide text-white disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: authMode === 'login'
                  ? 'linear-gradient(135deg, #10b981, #14b8a6, #059669, #10b981)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6, #6366f1, #8b5cf6)',
                backgroundSize: '300% 300%',
              }}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>{authMode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
              {/* Button shimmer */}
              {!isProcessing && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: 'shimmer 2.5s ease-in-out infinite' }} />
                </div>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[10px] text-gray-700 mt-5 font-medium tracking-wide">
            {authMode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className={`font-bold transition-colors ${authMode === 'login' ? 'text-emerald-500 hover:text-emerald-400' : 'text-indigo-400 hover:text-indigo-300'}`}
            >
              {authMode === 'login' ? 'Crie agora' : 'Faça login'}
            </button>
          </p>
        </div>

        {/* Version badge */}
        <p className="text-center text-[9px] text-gray-800 mt-4 font-mono tracking-widest">v2.0 • iMoney Bank™</p>
      </div>
    </div>
  );
};

export default AuthScreen;