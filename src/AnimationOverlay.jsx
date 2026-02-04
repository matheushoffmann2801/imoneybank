import React, { useEffect, useRef } from 'react';
import { 
  Sun, Palmtree, Umbrella, Siren, Unlock, Gavel as GavelIcon, Receipt, 
  Sparkles, AlertTriangle, Dices, Home, Key, Handshake, ThumbsDown, 
  Hammer, Coffee, HandCoins, Crown, SkipForward, Play, Skull, Megaphone, Landmark, Lock
  , CloudRain, Trophy, Users, ArrowRightLeft, PartyPopper, ShieldAlert, Ghost, CreditCard, ShoppingBag, Ban, Snowflake
} from 'lucide-react';
import { formatCurrency } from './utils';

const AnimationOverlay = ({ type, onComplete, duration = 3000, data = null }) => {
    const timerRef = useRef(null);
    const finish = () => { if (timerRef.current) clearTimeout(timerRef.current); if (onComplete) onComplete(); };
    useEffect(() => { timerRef.current = setTimeout(finish, duration); return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, [duration, type]);

    return (
        <div onClick={finish} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-white animate-in fade-in duration-300 overflow-hidden cursor-pointer">
            <style>{`
                @keyframes slideBars { 0% { transform: translateY(-100%); } 20% { transform: translateY(0); } 80% { transform: translateY(0); } 100% { transform: translateY(-100%); } }
                @keyframes stamp { 0% { transform: scale(2) rotate(-15deg); opacity: 0; } 50% { transform: scale(0.9) rotate(-15deg); opacity: 1; } 100% { transform: scale(1) rotate(-15deg); opacity: 1; } }
                @keyframes spinCard3D { 0% { transform: rotateY(0deg) scale(0.5); } 100% { transform: rotateY(1080deg) scale(1); } }
                @keyframes rainMoney { 0% { transform: translateY(-100vh); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(100vh); opacity: 0; } }
                @keyframes flyPlane { 0% { transform: translateX(-120vw) translateY(50px) rotate(-5deg); } 100% { transform: translateX(120vw) translateY(-50px) rotate(-5deg); } }
                @keyframes popUp { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
                @keyframes sway { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
                @keyframes openBars { 0% { transform: translateY(0); } 100% { transform: translateY(-100%); } }
                @keyframes shine { 0% { left: -100%; } 100% { left: 200%; } }
                @keyframes shake { 0% { transform: translate(1px, 1px) rotate(0deg); } 10% { transform: translate(-1px, -2px) rotate(-1deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 30% { transform: translate(3px, 2px) rotate(0deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 50% { transform: translate(-1px, 2px) rotate(-1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 70% { transform: translate(3px, 1px) rotate(-1deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 90% { transform: translate(1px, 2px) rotate(0deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }
                @keyframes rain { 0% { transform: translateY(-20px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(100vh); opacity: 0; } }
            `}</style>
            <div className="relative w-full max-w-md h-full flex flex-col items-center justify-center pointer-events-none">
                {type === 'plane' && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-sky-400 to-blue-600 overflow-hidden"><Sun size={120} className="text-yellow-300 absolute top-10 right-10 animate-[spin_20s_linear_infinite] drop-shadow-[0_0_30px_rgba(253,224,71,0.8)]" /><div className="absolute bottom-0 w-full h-1/3 bg-[#eecfa1]"></div><div className="absolute bottom-1/3 w-full h-16 bg-blue-500/50 animate-pulse skew-y-2 scale-110"></div><div className="z-10 flex items-end gap-2 mb-20"><Palmtree size={140} className="text-emerald-800 fill-emerald-700 drop-shadow-xl origin-bottom animate-[sway_3s_ease-in-out_infinite]" /><Umbrella size={100} className="text-red-500 fill-red-500 drop-shadow-xl -rotate-12" /></div><div className="z-20 bg-white/90 text-blue-600 px-8 py-4 rounded-3xl shadow-2xl transform rotate-2 border-4 border-blue-200"><h1 className="text-5xl font-black uppercase tracking-tighter">FÉRIAS!</h1></div></div>)}
                {type === 'jail' && (<div className="w-full h-full relative flex flex-col items-center justify-center"><div className="absolute inset-0 bg-red-950/50 animate-pulse"></div><div className="absolute inset-x-0 top-0 h-full flex justify-around pointer-events-none" style={{animation: 'slideBars 3s cubic-bezier(0.25, 1, 0.5, 1) forwards'}}>{[...Array(6)].map((_, i) => (<div key={i} className="w-8 h-full bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 shadow-2xl border-x border-black"></div>))}</div><Siren size={80} className="text-red-500 animate-[ping_1s_ease-in-out_infinite] mb-6 z-10 relative drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" /><div className="text-4xl font-black uppercase tracking-tighter text-red-500 z-10 relative bg-black/80 px-8 py-2 rounded-xl border-4 border-red-600 rotate-[-5deg]">PRESO!</div></div>)}
                {type === 'jail_open' && (<div className="w-full h-full relative flex flex-col items-center justify-center"><div className="absolute inset-x-0 top-0 h-full flex justify-around pointer-events-none" style={{animation: 'openBars 2s ease-in-out forwards'}}>{[...Array(6)].map((_, i) => (<div key={i} className="w-8 h-full bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 shadow-2xl border-x border-black"></div>))}</div><Unlock size={100} className="text-emerald-400 animate-bounce z-10 relative drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]" /><div className="text-4xl font-black uppercase tracking-tighter text-emerald-400 z-10 relative bg-black/80 px-8 py-2 rounded-xl border-4 border-emerald-500 rotate-[-5deg] mt-6">LIVRE!</div></div>)}
                {type === 'tax' && (<div className="w-full h-full relative flex flex-col items-center justify-center"><div style={{animation: 'stamp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'}}><div className="border-8 border-red-600 p-8 px-12 rounded-xl bg-red-900/95 backdrop-blur-xl shadow-[0_0_100px_rgba(220,38,38,0.8)] rotate-[-15deg]"><h1 className="text-5xl font-black text-red-500 tracking-tighter uppercase">TAXADO!</h1></div></div><div className="mt-8 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 animate-[popUp_0.5s_ease-out_0.2s]"><p className="text-white font-bold uppercase tracking-widest text-center">{data?.text || 'Receita Federal'}</p></div></div>)}
                {type === 'refund' && (<div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden">{[...Array(30)].map((_, i) => (<div key={i} className="absolute text-emerald-400 font-bold animate-[rainMoney_2s_linear_infinite]" style={{left: `${Math.random() * 100}%`, animationDelay: `${Math.random()}s`, fontSize: `${15 + Math.random() * 20}px`}}>$</div>))}<div className="z-10 bg-emerald-600 p-8 rounded-full backdrop-blur-md animate-[popUp_0.5s_ease-out] border-8 border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.6)]"><Receipt size={100} className="text-white mx-auto" /></div><h1 className="text-4xl font-black text-emerald-400 uppercase tracking-tighter mt-8 drop-shadow-2xl z-10 bg-black/50 px-6 py-2 rounded-xl border border-emerald-500/50">RESTITUIÇÃO!</h1></div>)}
                {(type === 'luck_anim' || type === 'setback_anim') && (<div className="perspective-1000 w-full h-full flex flex-col items-center justify-center"><div className="w-64 h-[400px] relative" style={{animation: 'spinCard3D 2s ease-out forwards'}}><div className={`w-full h-full rounded-[2rem] border-8 flex flex-col items-center justify-center p-6 text-center shadow-[0_0_100px_rgba(255,255,255,0.4)] ${type === 'luck_anim' ? 'bg-gradient-to-br from-emerald-600 to-green-900 border-emerald-400' : 'bg-gradient-to-br from-red-600 to-rose-900 border-red-400'}`}>{type === 'luck_anim' ? (<><Sparkles size={80} className="text-yellow-300 mb-6 animate-pulse" /><h1 className="text-4xl font-black text-white uppercase tracking-widest drop-shadow-lg">SORTE!</h1></>) : (<><AlertTriangle size={80} className="text-yellow-400 mb-6 animate-pulse" /><h1 className="text-4xl font-black text-white uppercase tracking-widest drop-shadow-lg">REVÉS!</h1></>)}
                {data && data.playerName && <p className="text-xs text-white/80 font-bold uppercase mt-2 bg-black/20 px-2 py-1 rounded">{data.playerName}</p>}
                {data && data.title && <p className="text-lg font-bold text-white mt-4 leading-tight">{data.title}</p>}
                {data && data.amountStr && <p className="text-2xl font-black text-white mt-2 drop-shadow-md bg-black/20 px-3 py-1 rounded-lg">{data.amountStr}</p>}
                </div></div></div>)}
                {type === 'epic_anim' && (<div className="perspective-1000 w-full h-full flex flex-col items-center justify-center"><div className="w-72 h-[450px] relative" style={{animation: 'spinCard3D 2.5s ease-out forwards'}}><div className="w-full h-full rounded-[2rem] border-8 border-yellow-300 flex flex-col items-center justify-center p-6 text-center shadow-[0_0_100px_rgba(251,191,36,0.8)] bg-gradient-to-br from-yellow-600 via-yellow-400 to-yellow-700 relative overflow-hidden"><div className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shine_2s_infinite_linear]" style={{transform: 'skewX(-20deg)'}}></div><Crown size={100} className="text-white mb-6 animate-bounce drop-shadow-lg relative z-10" /><h1 className="text-5xl font-black text-white uppercase tracking-widest drop-shadow-xl mb-2 relative z-10">ÉPICO!</h1><Sparkles size={40} className="text-yellow-100 animate-pulse absolute top-10 right-10 z-10" /><Sparkles size={40} className="text-yellow-100 animate-pulse absolute bottom-10 left-10 z-10" /></div></div></div>)}
                {type === 'dice' && (<div className="flex flex-col items-center"><Dices size={100} className="text-emerald-400 animate-[spin_0.4s_linear_infinite] mb-6 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]" /><div className="text-2xl font-black uppercase tracking-widest text-emerald-200">Sorteando...</div></div>)}
                {type === 'dice_result' && data && (
                    <div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]">
                        <div className="text-2xl font-bold text-emerald-200 mb-4 uppercase tracking-widest">{data.playerName} rolou:</div>
                        <div className="flex gap-4 mb-6">
                            <div className="w-24 h-24 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center justify-center border-4 border-gray-200 text-6xl font-black text-gray-800 animate-[spin_0.5s_ease-out]">{data.die1}</div>
                            <div className="w-24 h-24 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center justify-center border-4 border-gray-200 text-6xl font-black text-gray-800 animate-[spin_0.6s_ease-out]">{data.die2}</div>
                        </div>
                        <div className="text-6xl font-black text-white drop-shadow-2xl">{data.result}</div>
                    </div>
                )}
                {type === 'buy' && (<div className="flex flex-col items-center justify-center h-full"><div className="relative animate-[popUp_0.6s_ease-out]"><Home size={120} className="text-yellow-400 drop-shadow-[0_0_40px_rgba(250,204,21,0.8)] mb-4" /><Key size={50} className="absolute -bottom-2 -right-4 text-white bg-yellow-600 rounded-full p-2 animate-bounce shadow-lg" /></div><div className="text-3xl font-black uppercase tracking-tighter text-yellow-300 mt-4 text-center drop-shadow-xl">NOVA<br/>PROPRIEDADE</div></div>)}
                {type === 'sell' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-emerald-500 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(16,185,129,0.8)] border-8 border-white/20"><Handshake size={100} className="text-white" /></div><h1 className="text-4xl font-black text-emerald-400 uppercase tracking-tighter drop-shadow-2xl text-center">NEGÓCIO FECHADO!</h1></div>)}
                {type === 'reject' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-red-500 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(239,68,68,0.8)] border-8 border-white/20"><ThumbsDown size={100} className="text-white" /></div><h1 className="text-4xl font-black text-red-400 uppercase tracking-tighter drop-shadow-2xl text-center">RECUSADO!</h1></div>)}
                {type === 'construct' && (<div className="flex flex-col items-center justify-center h-full"><Hammer size={100} className="text-blue-400 animate-[pulse_0.5s_infinite] mb-6 rotate-45" /><div className="text-2xl font-black uppercase tracking-widest text-blue-200">Obras em Andamento!</div></div>)}
                {type === 'visit' && (<div className="flex flex-col items-center justify-center animate-[popUp_0.5s_ease-out]"><div className="bg-blue-500/20 p-8 rounded-full mb-6 backdrop-blur-md shadow-[0_0_50px_rgba(59,130,246,0.5)] border border-blue-400/50"><Coffee size={80} className="text-blue-300" /></div><div className="text-3xl font-black uppercase tracking-widest text-blue-300 drop-shadow-lg text-center">Visita Social</div></div>)}
                {type === 'rent_pay' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-orange-600 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(234,88,12,0.8)] border-8 border-white/20"><HandCoins size={100} className="text-white" /></div><h1 className="text-4xl font-black text-orange-400 uppercase tracking-tighter drop-shadow-2xl text-center">PAGOU<br/>ALUGUEL</h1></div>)}
                {type === 'rent_receive' && (
                    <div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden">
                        {/* Chuva de dinheiro intensa */}
                        {[...Array(30)].map((_, i) => (
                            <div key={i} className="absolute text-emerald-400 font-bold animate-[rainMoney_2.5s_linear_infinite]" style={{left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, fontSize: `${20 + Math.random() * 30}px`, opacity: 0.7}}>$</div>
                        ))}
                        <div className="z-10 relative animate-[popUp_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
                            <div className="bg-gradient-to-b from-emerald-500 to-emerald-700 p-8 rounded-[2rem] mb-6 shadow-[0_0_100px_rgba(16,185,129,0.6)] border-4 border-emerald-300 flex items-center justify-center relative">
                                <Home size={120} className="text-emerald-900 absolute opacity-30 scale-110" />
                                <HandCoins size={100} className="text-white relative z-10 drop-shadow-lg" />
                                <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full animate-bounce shadow-lg border-2 border-white">$$$</div>
                            </div>
                        </div>
                        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-emerald-200 uppercase tracking-tighter drop-shadow-sm text-center z-10 animate-[pulse_1s_infinite]">
                            ALUGUEL<br/>RECEBIDO
                        </h1>
                        {data && (
                            <div className="z-10 mt-6 text-center animate-[popUp_0.8s_ease-out_0.2s] flex flex-col items-center">
                                <span className="bg-emerald-900/50 text-emerald-200 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider backdrop-blur-sm border border-emerald-500/30 mb-2">{data.text}</span>
                                <span className="text-5xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">{data.amount}</span>
                            </div>
                        )}
                    </div>
                )}
                {type === 'turn_pass' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-slate-800 p-8 rounded-full mb-6 shadow-[0_0_50px_rgba(30,41,59,0.8)] border-8 border-slate-600"><SkipForward size={100} className="text-slate-400" /></div><h1 className="text-4xl font-black text-slate-400 uppercase tracking-widest drop-shadow-2xl text-center">VEZ<br/>PASSADA</h1></div>)}
                {type === 'your_turn' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-emerald-600 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(5,150,105,0.8)] border-8 border-emerald-400"><Megaphone size={100} className="text-white animate-bounce" /></div><h1 className="text-5xl font-black text-emerald-400 uppercase tracking-tighter drop-shadow-2xl text-center">SUA VEZ!</h1></div>)}
                {type === 'start_game' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-emerald-600 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(5,150,105,0.8)] border-8 border-emerald-400"><Play size={100} className="text-white fill-white ml-2" /></div><h1 className="text-5xl font-black text-emerald-400 uppercase tracking-tighter drop-shadow-2xl text-center">JOGO<br/>INICIADO!</h1></div>)}
                {type === 'bankrupt_anim' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-red-950 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(69,10,10,0.8)] border-8 border-red-900"><Skull size={100} className="text-red-600" /></div><h1 className="text-5xl font-black text-red-600 uppercase tracking-tighter drop-shadow-2xl text-center">FALÊNCIA!</h1></div>)}
                {type === 'earthquake' && (<div className="flex flex-col items-center justify-center h-full animate-[shake_0.5s_infinite]"><div className="bg-red-950 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(153,27,27,0.8)] border-8 border-red-800"><Home size={100} className="text-red-500" /></div><h1 className="text-5xl font-black text-red-500 uppercase tracking-tighter drop-shadow-2xl text-center">TERREMOTO!</h1></div>)}
                {type === 'loan' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-blue-600 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(37,99,235,0.8)] border-8 border-blue-400"><Landmark size={100} className="text-white" /></div><h1 className="text-4xl font-black text-blue-400 uppercase tracking-tighter drop-shadow-2xl text-center">EMPRÉSTIMO<br/>APROVADO!</h1></div>)}
                {type === 'lock' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-gray-800 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(31,41,55,0.8)] border-8 border-gray-600"><Lock size={100} className="text-red-500" /></div><h1 className="text-4xl font-black text-gray-400 uppercase tracking-tighter drop-shadow-2xl text-center">HIPOTECADO</h1></div>)}
                {type === 'unlock' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-emerald-600 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(5,150,105,0.8)] border-8 border-emerald-400"><Unlock size={100} className="text-white" /></div><h1 className="text-4xl font-black text-emerald-400 uppercase tracking-tighter drop-shadow-2xl text-center">RESGATADO!</h1></div>)}
                
                {/* NOVAS ANIMAÇÕES */}
                {type === 'weather_sun' && (
                    <div className="absolute inset-0 bg-sky-400/90 flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-1000">
                        <Sun size={200} className="text-yellow-300 animate-[spin_10s_linear_infinite] drop-shadow-[0_0_80px_rgba(253,224,71,1)]" />
                        <h1 className="text-5xl font-black text-white uppercase tracking-tighter mt-12 drop-shadow-xl animate-bounce text-center">DIA DE<br/>SOL!</h1>
                        <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full mt-4 border border-white/30">
                            <p className="text-lg text-white font-bold uppercase tracking-widest">Turismo em Alta (+20%)</p>
                        </div>
                    </div>
                )}
                {type === 'weather_rain' && (
                    <div className="absolute inset-0 bg-slate-800/90 flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-1000">
                        {[...Array(40)].map((_, i) => (
                            <div key={i} className="absolute w-0.5 h-16 bg-blue-400/40 rounded-full" style={{left: `${Math.random()*100}%`, top: `-10%`, animation: `rain ${0.5+Math.random()}s linear infinite`, animationDelay: `${Math.random()}s`}}></div>
                        ))}
                        <CloudRain size={200} className="text-blue-300 animate-pulse drop-shadow-[0_0_50px_rgba(147,197,253,0.5)] z-10" />
                        <h1 className="text-5xl font-black text-white uppercase tracking-tighter mt-8 drop-shadow-xl z-10 text-center">CHUVA<br/>FORTE!</h1>
                        <div className="bg-black/30 backdrop-blur-md px-6 py-2 rounded-full mt-4 border border-white/10 z-10">
                            <p className="text-lg text-blue-200 font-bold uppercase tracking-widest">Turismo em Baixa (-20%)</p>
                        </div>
                    </div>
                )}
                {type === 'achievement' && (
                    <div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-40 animate-pulse rounded-full"></div>
                            <Trophy size={140} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] relative z-10" />
                            <Sparkles size={60} className="text-yellow-100 absolute -top-4 -right-4 animate-spin z-10" />
                        </div>
                        <h1 className="text-4xl font-black text-yellow-300 uppercase tracking-tighter drop-shadow-2xl text-center mt-8">CONQUISTA<br/>DESBLOQUEADA!</h1>
                        {data && (
                            <div className="mt-6 text-center bg-black/40 p-6 rounded-3xl backdrop-blur-md border border-yellow-500/30 shadow-xl transform rotate-1">
                                <p className="text-xl font-bold text-white uppercase tracking-wide">{data.title}</p>
                                <p className="text-3xl font-black text-emerald-400 mt-2 drop-shadow-md">+{data.reward}</p>
                            </div>
                        )}
                    </div>
                )}
                {type === 'community_income' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="flex gap-4 mb-8 items-center"><Users size={60} className="text-emerald-400 opacity-50" /><ArrowRightLeft size={50} className="text-white animate-pulse" /><Home size={80} className="text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.6)]" /></div><h1 className="text-4xl font-black text-emerald-400 uppercase tracking-tighter text-center drop-shadow-2xl">RECEBEU DA<br/>GALERA!</h1></div>)}
                {type === 'community_expense' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="flex gap-4 mb-8 items-center"><Home size={80} className="text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]" /><ArrowRightLeft size={50} className="text-white animate-pulse" /><Users size={60} className="text-red-400 opacity-50" /></div><h1 className="text-4xl font-black text-red-500 uppercase tracking-tighter text-center drop-shadow-2xl">PAGOU PRA<br/>GERAL!</h1></div>)}
                
                {type === 'auction_start' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-indigo-900 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(49,46,129,0.8)] border-8 border-indigo-600"><GavelIcon size={100} className="text-white animate-[sway_1s_infinite]" /></div><h1 className="text-4xl font-black text-indigo-400 uppercase tracking-tighter drop-shadow-2xl text-center">LEILÃO<br/>INICIADO!</h1>{data && data.item && <p className="text-white mt-4 font-bold bg-black/50 px-4 py-2 rounded-lg text-xl">{data.item}</p>}</div>)}
                {type === 'auction_sold' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-emerald-600 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(5,150,105,0.8)] border-8 border-emerald-400"><Hammer size={100} className="text-white" /></div><h1 className="text-5xl font-black text-emerald-400 uppercase tracking-tighter drop-shadow-2xl text-center">VENDIDO!</h1></div>)}
                {type === 'seized' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-red-950 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(127,29,29,0.8)] border-8 border-red-800"><ShieldAlert size={100} className="text-red-500" /></div><h1 className="text-5xl font-black text-red-600 uppercase tracking-tighter drop-shadow-2xl text-center">PENHORADO!</h1></div>)}
                
                {type === 'steal' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-purple-900 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(88,28,135,0.8)] border-8 border-purple-600"><Ghost size={100} className="text-purple-300" /></div><h1 className="text-5xl font-black text-purple-400 uppercase tracking-tighter drop-shadow-2xl text-center">ROUBADO!</h1></div>)}
                {type === 'force_buy' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-indigo-600 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(79,70,229,0.8)] border-8 border-indigo-400"><ShoppingBag size={100} className="text-white" /></div><h1 className="text-4xl font-black text-indigo-300 uppercase tracking-tighter drop-shadow-2xl text-center">COMPRA<br/>FORÇADA!</h1></div>)}
                {type === 'black_card' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-gray-900 p-8 rounded-xl mb-6 shadow-[0_0_100px_rgba(0,0,0,0.8)] border-4 border-gray-700 rotate-3"><CreditCard size={100} className="text-gray-200" /></div><h1 className="text-4xl font-black text-gray-200 uppercase tracking-tighter drop-shadow-2xl text-center">DÍVIDA<br/>PAGA!</h1></div>)}
                {type === 'banned' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-red-600 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(220,38,38,0.8)] border-8 border-red-400"><Ban size={100} className="text-white" /></div><h1 className="text-5xl font-black text-red-400 uppercase tracking-tighter drop-shadow-2xl text-center">EXPULSO!</h1></div>)}
                {type === 'frozen' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-blue-500 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(59,130,246,0.8)] border-8 border-blue-300"><Snowflake size={100} className="text-white animate-[spin_3s_linear_infinite]" /></div><h1 className="text-5xl font-black text-blue-200 uppercase tracking-tighter drop-shadow-2xl text-center">CONGELADO!</h1></div>)}
                {type === 'loan_pay_anim' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-blue-600 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(37,99,235,0.8)] border-8 border-blue-400"><Landmark size={100} className="text-white" /></div><h1 className="text-4xl font-black text-blue-400 uppercase tracking-tighter drop-shadow-2xl text-center">EMPRÉSTIMO<br/>QUITADO!</h1></div>)}
                {type === 'debt_pay_anim' && (<div className="flex flex-col items-center justify-center h-full animate-[popUp_0.5s_ease-out]"><div className="bg-emerald-600 p-8 rounded-full mb-6 shadow-[0_0_100px_rgba(5,150,105,0.8)] border-8 border-emerald-400"><Handshake size={100} className="text-white" /></div><h1 className="text-4xl font-black text-emerald-400 uppercase tracking-tighter drop-shadow-2xl text-center">DÍVIDA<br/>PAGA!</h1></div>)}
            </div>
            <p className="absolute bottom-12 text-white/30 text-[10px] animate-pulse font-mono tracking-widest uppercase pointer-events-none">Toque para pular</p>
        </div>
    );
};

export default AnimationOverlay;
