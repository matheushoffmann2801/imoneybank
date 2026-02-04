import React from 'react';
import { Trophy, CheckCircle2, Lock, Gift } from 'lucide-react';
import { ACHIEVEMENTS_DB } from './AchievementsDB';
import { formatCurrency } from './utils';
import { PROPERTIES_DB } from './PropertiesDB';

const AchievementsTab = ({ players, user, handleTransaction }) => {
    const myPlayer = players[user.uid];
    const myAchievements = myPlayer.achievements || [];

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out pb-20">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-3xl shadow-xl text-white text-center relative overflow-hidden border border-white/10">
                <div className="absolute top-[-20%] right-[-10%] p-4 opacity-5 rotate-12"><Trophy size={120} /></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-1 drop-shadow-lg text-white">Conquistas</h2>
                    <p className="text-sm font-medium opacity-90 mb-4 text-white/90">Complete metas para ganhar recompensas!</p>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-black/40 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/10">
                            <div 
                                className="bg-gradient-to-r from-emerald-300 to-teal-400 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.5)]" 
                                style={{ width: `${(myAchievements.length / ACHIEVEMENTS_DB.length) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-black font-mono text-white">{myAchievements.length}/{ACHIEVEMENTS_DB.length}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {ACHIEVEMENTS_DB.map(ach => {
                    const isCompleted = myAchievements.includes(ach.id);
                    const canClaim = !isCompleted && ach.condition(myPlayer, PROPERTIES_DB);

                    return (
                        <div key={ach.id} className={`relative p-4 rounded-2xl border transition-all duration-300 ${isCompleted ? 'bg-emerald-50 border-emerald-200' : (canClaim ? 'bg-amber-50 border-amber-300 shadow-lg scale-[1.02] z-10' : 'bg-white border-gray-200')}`}>
                            <div className="flex gap-4 items-center">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isCompleted ? 'bg-emerald-100 text-emerald-600' : (canClaim ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white animate-bounce shadow-amber-200' : 'bg-gray-100 text-gray-400')}`}>
                                    {isCompleted ? <CheckCircle2 size={24} strokeWidth={3} /> : (canClaim ? <Gift size={24} strokeWidth={3} /> : <Lock size={24} className="text-gray-300" />)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-black text-sm uppercase tracking-wide truncate ${isCompleted ? 'text-emerald-800' : (canClaim ? 'text-gray-800' : 'text-gray-500')}`}>{ach.title}</h3>
                                    <p className={`text-xs leading-snug ${isCompleted ? 'text-emerald-700/80' : 'text-gray-400'}`}>{ach.description}</p>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Recompensa</span>
                                    <span className={`text-sm font-black ${isCompleted ? 'text-emerald-600' : (canClaim ? 'text-orange-600' : 'text-gray-400')}`}>{formatCurrency(ach.reward)}</span>
                                </div>

                                {canClaim ? (
                                    <button 
                                        onClick={() => handleTransaction('claim_achievement', ach.reward, null, ach.title, ach.id)}
                                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <Gift size={14} /> RESGATAR
                                    </button>
                                ) : (
                                    isCompleted && (
                                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                                            <CheckCircle2 size={10} /> Resgatado
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AchievementsTab;
