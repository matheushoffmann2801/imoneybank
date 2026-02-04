import React, { useState } from 'react';
import { TrendingUp, TrendingDown, HandCoins, Landmark, Construction, Key, Handshake, BadgePercent, Siren, Unlock, ArrowRightLeft, Skull, Ban, Ghost, CreditCard, Gavel, Info, Receipt, Dices, ScrollText, Calendar } from 'lucide-react';
import { formatCurrency } from './utils';

const HistoryTab = ({ transactions, setSelectedReceipt }) => {
    const [viewMode, setViewMode] = useState('statement'); // 'statement' (Extrato) ou 'history' (Ações)

    const getIconForType = (type) => {
        switch(type) {
            case 'income': case 'receive_all': return <TrendingUp size={16} className="text-emerald-600"/>;
            case 'expense': case 'pay_all': return <TrendingDown size={16} className="text-red-600"/>;
            case 'charge_rent': case 'pay_rent': return <HandCoins size={16} className="text-orange-600"/>;
            case 'pay_bank_rent': return <Landmark size={16} className="text-red-600"/>;
            case 'build': return <Construction size={16} className="text-blue-600"/>;
            case 'buy_prop': return <Key size={16} className="text-emerald-600"/>;
            case 'trade_accepted': return <Handshake size={16} className="text-indigo-600"/>;
            case 'sell_prop': return <BadgePercent size={16} className="text-indigo-600"/>;
            case 'go_to_jail': return <Siren size={16} className="text-red-600"/>;
            case 'pay_bail': return <Unlock size={16} className="text-emerald-600"/>;
            case 'transfer': return <ArrowRightLeft size={16} className="text-purple-600"/>;
            case 'loan_take': return <Landmark size={16} className="text-orange-600"/>;
            case 'bankrupt': return <Skull size={16} className="text-gray-800"/>;
            case 'offer_rejected': return <Ban size={16} className="text-red-600"/>;
            case 'steal_prop': return <Ghost size={16} className="text-purple-600"/>;
            case 'loan_accepted': return <Handshake size={16} className="text-emerald-600"/>;
            case 'use_black_card': return <CreditCard size={16} className="text-gray-800"/>;
            case 'start_auction': case 'place_bid': case 'end_auction': return <Gavel size={16} className="text-indigo-800"/>;
            case 'dice_roll': return <Dices size={16} className="text-blue-500"/>;
            case 'card_draw': case 'event': return <ScrollText size={16} className="text-yellow-600"/>;
            case 'pass_turn': return <ArrowRightLeft size={16} className="text-gray-400"/>;
            case 'start_game': return <Calendar size={16} className="text-emerald-500"/>;
            default: return <Info size={16} className="text-gray-600"/>;
        }
    };

    // Filtros
    const financialTypes = ['income', 'expense', 'transfer', 'pay_rent', 'charge_rent', 'pay_bank_rent', 'build', 'buy_prop', 'sell_house', 'sell_bank', 'loan_take', 'loan_pay', 'pay_bail', 'pay_all', 'receive_all', 'pay_loan_percent', 'pay_private_debt', 'accept_offer', 'end_auction', 'claim_achievement'];
    
    const actionTypes = ['dice_roll', 'card_draw', 'event', 'pass_turn', 'go_to_jail', 'start_game', 'vote_restart', 'bankrupt', 'quit_game', 'steal_prop', 'force_buy', 'use_habeas_corpus', 'use_black_card', 'freeze_player', 'make_offer', 'make_trade_offer', 'reject_offer', 'start_auction', 'place_bid', 'add_inventory'];

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {/* Seletor de Modo */}
            <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                <button 
                    onClick={() => setViewMode('statement')} 
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'statement' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    EXTRATO BANCÁRIO
                </button>
                <button 
                    onClick={() => setViewMode('history')} 
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    HISTÓRICO DE AÇÕES
                </button>
            </div>

            <div className="space-y-1.5">
                {(() => {
                    const filtered = transactions.filter(t => {
                        if (viewMode === 'statement') {
                            // Mostra apenas transações financeiras (valor > 0 ou tipos específicos)
                            return financialTypes.includes(t.type) || (t.amount > 0 && !actionTypes.includes(t.type));
                        } else {
                            // Mostra ações do jogo
                            return actionTypes.includes(t.type);
                        }
                    });
                    
                    if (filtered.length === 0) return <p className="text-center text-xs text-gray-400 py-8 italic">Nenhuma transação encontrada.</p>;
                    
                    return filtered.map(t => (
                        <div key={t.id} onClick={() => viewMode === 'statement' ? setSelectedReceipt(t) : null} className={`flex items-start p-2.5 rounded-xl border border-gray-100 bg-white gap-2 transition group ${viewMode === 'statement' ? 'active:bg-gray-50 cursor-pointer' : ''}`}>
                            <div className={`h-8 w-8 shrink-0 flex items-center justify-center rounded-full ${['income','build','buy_prop'].includes(t.type)?'bg-emerald-100':(['expense','pay_rent','go_to_jail','pay_bank_rent'].includes(t.type)?'bg-red-100':(t.type === 'dice_roll' ? 'bg-blue-50' : 'bg-gray-100'))}`}>{getIconForType(t.type)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className="text-xs font-bold text-gray-800 leading-tight mb-0.5 whitespace-normal break-words">{t.description || 'Sem descrição'}</p>
                                    {viewMode === 'statement' && t.amount > 0 && <span className={`text-xs font-bold shrink-0 ${['income'].includes(t.type)?'text-emerald-600':(['expense','pay_bank_rent'].includes(t.type)?'text-red-600':'text-gray-600')}`}>{formatCurrency(t.amount)}</span>}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[8px] text-gray-400">{new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    <div className="flex items-center gap-1">
                                        {viewMode === 'statement' ? (
                                            <>
                                                <p className="text-[8px] text-gray-500 truncate max-w-[100px]">{t.senderName || 'Banco'} ➝ {t.receiverName || 'Banco'}</p>
                                                <Receipt size={10} className="text-gray-300 group-hover:text-indigo-400 transition-colors"/>
                                            </>
                                        ) : (
                                            <p className="text-[8px] text-gray-500">{t.senderName || 'Sistema'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ));
                })()}
            </div>
        </div>
    );
};

export default HistoryTab;
