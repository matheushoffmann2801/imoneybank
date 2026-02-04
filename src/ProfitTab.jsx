import React from 'react';
import { TrendingUp, Home, Building2, Dices } from 'lucide-react';
import { PROPERTIES_DB, COLORS } from './PropertiesDB';
import { formatCurrency } from './utils';

const ProfitTab = ({ players, user, getRent, roomData }) => {
    const myPlayer = players[user.uid];
    const myProperties = (myPlayer?.properties || []).map(id => PROPERTIES_DB.find(p => p.id === id)).filter(Boolean);

    // Calcula o aluguel total potencial (soma dos valores atuais)
    const totalPotentialRent = myProperties.reduce((sum, prop) => sum + getRent(prop, roomData), 0);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Potencial de Recebimento</p>
                <div className="flex items-center justify-center gap-2">
                    <TrendingUp size={24} className="text-emerald-500" />
                    <h2 className="text-4xl font-black text-gray-800">{formatCurrency(totalPotentialRent)}</h2>
                </div>
                <p className="text-[9px] text-gray-400 mt-2">Soma dos aluguéis atuais (estimado)</p>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Seus Imóveis</p>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{myProperties.length} Imóveis</span>
                </div>
                
                {myProperties.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Home size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400 font-medium">Você não possui imóveis rendendo aluguel.</p>
                    </div>
                ) : (
                    myProperties.map(prop => {
                        const houses = (myPlayer.houses || {})[prop.id] || 0;
                        const rent = getRent(prop, roomData);
                        const colorMap = COLORS[prop.group] || 'bg-gray-500';
                        const isCompany = prop.group === 'company' || prop.group === 'special';
                        
                        return (
                            <div key={prop.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${colorMap} shadow-sm ring-2 ring-white`}></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">{prop.name}</p>
                                        <div className="flex items-center gap-2 text-[9px] text-gray-500 mt-0.5">
                                            {isCompany ? (
                                                <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                                                    <Dices size={8}/> Companhia
                                                </span>
                                            ) : (
                                                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-bold ${houses > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    {houses >= 5 ? <Building2 size={8}/> : <Home size={8}/>} {houses} {houses === 1 ? 'Casa' : 'Casas'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-emerald-600">{formatCurrency(rent)}</p>
                                    <p className="text-[8px] text-gray-400 font-medium">
                                        {isCompany ? 'x Resultado Dados' : 'por visita'}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ProfitTab;
