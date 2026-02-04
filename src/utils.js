// --- UTILITÁRIOS E SOM ---

export const safeNum = (val) => { const num = parseFloat(val); return (isNaN(num) || !isFinite(num)) ? 0 : num; };
export const formatCurrency = (val) => '$ ' + safeNum(val).toLocaleString('pt-BR');
export const formatInputCurrency = (value) => { if (!value) return ''; const clean = value.replace(/\D/g, ''); return clean.replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
export const parseInputCurrency = (value) => { if (!value) return 0; return parseInt(value.replace(/\./g, ''), 10); };

export const vibrate = (pattern) => { if (typeof navigator !== 'undefined' && navigator.vibrate) try { navigator.vibrate(pattern); } catch (e) {} };

// Singleton para AudioContext
let globalAudioCtx = null;

export const playSound = (type, muted, content = null) => {
  if (muted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    if (!globalAudioCtx) globalAudioCtx = new AudioContext();
    const ctx = globalAudioCtx;
    
    if (ctx.state === 'suspended') ctx.resume();
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'chat' && content) {
        if (['👍', '🤝', 'Vendi!'].some(t => content.includes(t))) {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(440, now); osc.frequency.linearRampToValueAtTime(660, now + 0.15);
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
        } else if (['👎', '😡', 'Caloteiro!', 'Paga logo!', 'Aff...'].some(t => content.includes(t))) {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(100, now + 0.2);
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
        } else if (['😂', '🤡'].some(t => content.includes(t))) {
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); 
            osc.frequency.linearRampToValueAtTime(600, now + 0.1); osc.frequency.linearRampToValueAtTime(400, now + 0.2); osc.frequency.linearRampToValueAtTime(600, now + 0.3);
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.4);
        } else if (['😭', '💀', 'Sem dinheiro'].some(t => content.includes(t))) {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(200, now + 0.4);
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.4);
        } else if (['🤑'].some(t => content.includes(t))) {
            osc.type = 'sine'; osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
            gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        } else if (['👀', 'Troca?'].some(t => content.includes(t))) {
            osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); 
            gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        } else {
            osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); 
            gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        }
    } else if (type === 'income') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(500, now); osc.frequency.exponentialRampToValueAtTime(1000, now + 0.15);
        gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.15);
    } else if (type === 'expense') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.15);
    } else if (type === 'click') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.02, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    } else if (type === 'turn') {
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(400, now); 
        osc.frequency.linearRampToValueAtTime(600, now + 0.1); 
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.1, now); 
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
    } else if (type === 'build') {
        osc.type = 'square'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.03, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
    } else if (type === 'bankrupt') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, now); osc.frequency.linearRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now); osc.stop(now + 0.6); return;
    } else if (type === 'notification') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.02, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
    } else {
        osc.type = 'sine'; osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.02, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
    }
    osc.start(now); osc.stop(now + 0.5);
  } catch (e) { console.log("Audio error", e); }
};
