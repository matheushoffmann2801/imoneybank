import React from 'react';
import { Building2, Home } from 'lucide-react';
import { NEIGHBORHOOD_SERVICES, COLORS } from './PropertiesDB';
import { formatCurrency } from './utils';

const CityTab = ({ groupedProperties, players, user, setShowPropertyDetails }) => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <div className="space-y-4">
                {Object.entries(groupedProperties).map(([group, props]) => {
                    const conf = NEIGHBORHOOD_SERVICES[group] || { label: 'Bairro', icon: Building2 };
                    let totalHousesInGroup = 0;
                    props.forEach(p => { const owner = Object.values(players).find(pl => pl.properties?.includes(p.id)); if (owner) totalHousesInGroup += (owner.houses?.[p.id] || 0); });
                    const level1 = conf.level1; const level2 = conf.level2; const unlockedL1 = totalHousesInGroup >= (level1?.threshold || 5); const unlockedL2 = totalHousesInGroup >= (level2?.threshold || 10); const progress = Math.min(100, (totalHousesInGroup / (level2?.threshold || 10)) * 100);

                    return (
                        <div key={group} className="relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${COLORS[group]} shadow-sm`}></div><h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide">{conf.label}</h3></div>
                                <span className="text-[8px] font-bold text-gray-400">{totalHousesInGroup} constr.</span>
                            </div>
                            <div className="w-full bg-gray-100 h-1 rounded-full mb-3 overflow-hidden"><div className={`h-full ${COLORS[group].replace('bg-', 'bg-') || 'bg-gray-400'} transition-all duration-1000`} style={{width: `${progress}%`, opacity: 0.6}}></div></div>
                            <div className="flex gap-2 mb-3">
                                {level1 && (<div className={`flex-1 rounded-lg p-1.5 border flex items-center gap-1.5 transition-all ${unlockedL1 ? 'bg-white border-emerald-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-50 grayscale'}`}><div className={`w-6 h-6 rounded-full flex items-center justify-center ${unlockedL1 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}`}><level1.icon size={12}/></div><div className="min-w-0"><p className="text-[8px] font-bold text-gray-800 uppercase truncate">{level1.name}</p><p className="text-[7px] text-gray-400">{unlockedL1 ? `Ativo (+${Math.round(level1.bonus*100)}%)` : `${level1.threshold} un.`}</p></div></div>)}
                                {level2 && (<div className={`flex-1 rounded-lg p-1.5 border flex items-center gap-1.5 transition-all ${unlockedL2 ? 'bg-white border-indigo-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-50 grayscale'}`}><div className={`w-6 h-6 rounded-full flex items-center justify-center ${unlockedL2 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-400'}`}><level2.icon size={12}/></div><div className="min-w-0"><p className="text-[8px] font-bold text-gray-800 uppercase truncate">{level2.name}</p><p className="text-[7px] text-gray-400">{unlockedL2 ? `Ativo (+${Math.round(level2.bonus*100)}%)` : `${level2.threshold} un.`}</p></div></div>)}
                            </div>
                            <div className="grid grid-cols-3 gap-2 perspective-grid">
                                {props.map(prop => {
                                    const ownerId = Object.keys(players).find(uid => players[uid].properties?.includes(prop.id)); const owner = players[ownerId]; const houses = (owner?.houses || {})[prop.id] || 0; const isMyProp = ownerId === user.uid; const isOwned = !!ownerId;
                                    return (
                                        <div key={prop.id} onClick={()=>{setShowPropertyDetails(prop.id)}} className={`relative aspect-[4/3] rounded-lg border-2 flex flex-col justify-between p-1.5 transition-all cursor-pointer overflow-hidden ${isOwned ? 'bg-white border-gray-200 shadow-md hover:shadow-lg' : 'bg-gray-50 border-gray-100 opacity-60 hover:opacity-100 border-dashed'}`}>
                                            <div className="flex justify-between items-start z-10"><div className={`w-full h-1 rounded-full mb-0.5 ${COLORS[group]}`}></div></div>
                                            <div className="flex-1 flex items-center justify-center gap-0.5 flex-wrap px-0.5 my-0.5">
                                                {isOwned ? ( houses === 0 ? (<div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center text-gray-300 border border-gray-200"><span className="text-[7px] font-bold">LOTE</span></div>) : houses >= 5 ? (<div className="w-8 h-8 bg-red-100 rounded-md border-b-2 border-red-300 flex items-center justify-center text-red-500 shadow-sm relative top-0.5"><Building2 size={16}/></div>) : ([...Array(houses)].map((_, i) => (<div key={i} className="w-2.5 h-2.5 bg-emerald-100 rounded-sm border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm"><Home size={6}/></div>))) ) : (<div className="text-[8px] font-bold text-gray-300 rotate-[-15deg]">VENDE-SE</div>)}
                                            </div>
                                            <div className="z-10 bg-white/90 backdrop-blur-sm -mx-1.5 -mb-1.5 p-1 border-t border-gray-100 text-center"><p className="text-[7px] font-bold text-gray-800 truncate leading-tight">{prop.name}</p>{owner ? (<p className={`text-[6px] font-bold truncate ${isMyProp ? 'text-emerald-600' : 'text-indigo-600'}`}>{owner.avatar} {owner.name}</p>) : (<p className="text-[6px] text-emerald-500 font-bold">{formatCurrency(prop.price)}</p>)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CityTab;
