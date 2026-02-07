import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plane, Gavel, Siren, MapPin, HelpCircle, ArrowRight, User, DollarSign, Zap, Star, Lock } from 'lucide-react';
import { DiceRoller } from './DiceRoller';

// Cores vibrantes para o tema Neon/Dark
const getGroupColor = (group) => {
    const colors = {
        'light_green': 'from-emerald-400 to-emerald-600', 
        'purple': 'from-purple-400 to-purple-600', 
        'pink': 'from-pink-400 to-pink-600',
        'red': 'from-red-400 to-red-600', 
        'dark_green': 'from-green-600 to-green-800', 
        'dark_blue': 'from-blue-600 to-blue-800',
        'yellow': 'from-yellow-300 to-yellow-500', 
        'orange': 'from-orange-400 to-orange-600', 
        'company': 'from-slate-400 to-slate-600', 
        'special': 'from-indigo-400 to-indigo-600'
    };
    return colors[group] || 'from-slate-700 to-slate-800';
};

const getTileIcon = (type) => {
    switch(type) {
        case 'start': return <Home size={32} className="text-white drop-shadow-lg" />;
        case 'jail': return <Siren size={32} className="text-red-200 drop-shadow-lg" />;
        case 'parking': return <Plane size={32} className="text-blue-200 drop-shadow-lg" />;
        case 'gotojail': return <Gavel size={32} className="text-red-500 drop-shadow-lg" />;
        case 'company': return <Zap size={32} className="text-yellow-300 drop-shadow-lg" />;
        case 'empty': return <HelpCircle size={32} className="text-purple-300 drop-shadow-lg" />;
        default: return <MapPin size={24} className="text-white/50" />;
    }
};

const generateBoard = (propertiesDb) => {
    const board = Array(40).fill(null).map((_, i) => ({ index: i, id: i, type: 'empty', name: 'Sorte ou Revés' }));
    
    board[0] = { index: 0, id: 0, type: 'start', name: 'INÍCIO', color: 'from-emerald-500 to-emerald-700' };
    board[10] = { index: 10, id: 10, type: 'jail', name: 'CADEIA', color: 'from-slate-500 to-slate-700' };
    board[20] = { index: 20, id: 20, type: 'parking', name: 'FERIADO', color: 'from-blue-400 to-blue-600' };
    board[30] = { index: 30, id: 30, type: 'gotojail', name: 'VÁ P/ CADEIA', color: 'from-red-500 to-red-700' };

    let propIndex = 0;
    for (let i = 1; i < 40; i++) {
        if (board[i].type !== 'empty') continue;
        if (propIndex < propertiesDb.length) {
            const prop = propertiesDb[propIndex];
            board[i] = { 
                ...prop, 
                index: i,
                propId: prop.id, // Mantém ID original (string)
                id: i, // Sobrescreve com ID numérico para o tabuleiro
                type: prop.group === 'company' || prop.group === 'special' ? 'company' : 'property',
                gradient: getGroupColor(prop.group)
            };
            propIndex++;
        }
    }
    return board;
};

export const GameBoard = ({ 
    players, 
    propertiesDb, 
    currentPlayerId, 
    onPropertyClick,
    onRollDice,
    diceCooldown,
    isMyTurn,
    roomData,
    user
}) => {
    const boardTiles = React.useMemo(() => generateBoard(propertiesDb), [propertiesDb]);
    const scrollRef = useRef(null);
    const [focusedTile, setFocusedTile] = useState(0);

    // Auto-scroll inteligente: Segue o jogador da vez ou o próprio usuário
    useEffect(() => {
        const targetId = isMyTurn ? user.uid : currentPlayerId;
        if (targetId && players[targetId]) {
            const position = players[targetId].position || 0;
            scrollToTile(position);
        }
    }, [currentPlayerId, players, isMyTurn, user]);

    const scrollToTile = (index) => {
        const tileElement = document.getElementById(`tile-${index}`);
        if (tileElement && scrollRef.current) {
            // Centraliza o elemento na tela
            const container = scrollRef.current;
            const scrollLeft = tileElement.offsetLeft - (container.clientWidth / 2) + (tileElement.clientWidth / 2);
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            setFocusedTile(index);
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-[#0f172a] to-[#1e293b] overflow-hidden">
            
            {/* HUD Superior: Status do Turno */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent pt-safe-top">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${isMyTurn ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-yellow-500'}`} />
                        <span className="text-xs font-bold text-white uppercase tracking-widest shadow-black drop-shadow-md">
                            {isMyTurn ? 'SUA VEZ DE JOGAR' : `VEZ DE: ${players[currentPlayerId]?.name || '...'}`}
                        </span>
                    </div>
                    <button 
                        onClick={() => scrollToTile(players[user.uid]?.position || 0)}
                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md border border-white/10 transition active:scale-90"
                    >
                        <MapPin size={16} />
                    </button>
                </div>
            </div>

            {/* TRILHA DO TABULEIRO (CARROSSEL 3D) */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-x-auto flex items-center px-[50vw] snap-x snap-mandatory custom-scrollbar py-12"
                style={{ scrollPaddingLeft: '0px' }} // Ajuste fino para centralização
            >
                {boardTiles.map((tile) => {
                    const playersHere = Object.values(players).filter(p => (p.position || 0) === tile.id);
                    const isInteractive = tile.type === 'property' || tile.type === 'company';
                    const ownerId = Object.keys(players).find(uid => players[uid].properties?.includes(tile.propId));
                    const isMine = ownerId === user.uid;
                    const isMortgaged = ownerId && (players[ownerId].mortgaged || []).includes(tile.propId);
                    const isCurrentPlayerHere = (players[currentPlayerId]?.position || 0) === tile.id;

                    return (
                        <motion.div 
                            key={tile.id}
                            id={`tile-${tile.id}`}
                            initial={{ scale: 0.9, opacity: 0.5 }}
                            whileInView={{ scale: 1, opacity: 1, y: 0 }}
                            viewport={{ amount: 0.6, margin: "0px -20% 0px -20%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={() => isInteractive && onPropertyClick && onPropertyClick(tile.propId)}
                            className={`
                                relative flex-shrink-0 w-56 h-80 mx-2 rounded-3xl snap-center flex flex-col justify-between
                                shadow-2xl transition-all duration-300 border-4
                                ${tile.id === 0 ? 'bg-emerald-900/80' : 'bg-[#1e293b]'}
                                ${isCurrentPlayerHere 
                                    ? 'border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)] z-10' 
                                    : (tile.id === 0 ? 'border-emerald-500/50' : 'border-white/5')
                                }
                                ${isInteractive ? 'cursor-pointer hover:border-white/30 active:scale-95' : ''}
                                ${isMine ? 'ring-4 ring-emerald-500 ring-offset-4 ring-offset-black' : ''}
                            `}
                        >
                            {/* Efeito de Brilho Pulsante */}
                            {isCurrentPlayerHere && (
                                <div className="absolute inset-0 rounded-[1.3rem] bg-yellow-400/10 animate-pulse pointer-events-none" />
                            )}

                            {/* Cabeçalho do Card (Cor/Gradiente) */}
                            <div className={`h-24 w-full rounded-t-2xl bg-gradient-to-br ${tile.gradient || tile.color || 'from-gray-700 to-gray-800'} relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-black/10" />
                                <div className="absolute top-2 left-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                                    <span className="text-xs font-mono font-bold text-white">#{tile.index}</span>
                                </div>
                                {isMortgaged && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                                        <Lock className="text-white/80" size={32} />
                                    </div>
                                )}
                            </div>

                            {/* Conteúdo Central */}
                            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center relative">
                                {/* Ícone de Fundo */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                                    {getTileIcon(tile.type)}
                                </div>

                                <h3 className="text-xl font-black text-white uppercase leading-tight mb-2 drop-shadow-md">
                                    {tile.name}
                                </h3>
                                
                                {tile.price && (
                                    <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm">
                                        <span className="text-emerald-400 font-mono font-bold text-lg">
                                            ${(tile.price/1000).toFixed(0)}k
                                        </span>
                                    </div>
                                )}

                                {/* Dono da Propriedade */}
                                {ownerId && (
                                    <div className="mt-4 flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-white/5">
                                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold overflow-hidden">
                                            {players[ownerId]?.avatar ? <img src={players[ownerId].avatar} className="w-full h-full object-cover"/> : players[ownerId]?.name?.[0]}
                                        </div>
                                        <span className="text-[10px] text-gray-300 truncate max-w-[80px]">
                                            {players[ownerId]?.name}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Área dos Peões (Flutuando sobre o card) */}
                            <div className="absolute -bottom-4 left-0 right-0 flex justify-center items-end -space-x-3 px-2 pointer-events-none z-30">
                                <AnimatePresence>
                                {playersHere.map((player) => (
                                    <motion.div
                                        layoutId={`pawn-${player.id}`}
                                        key={player.id}
                                        initial={{ y: -20, opacity: 0, scale: 0 }}
                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className="relative group transition-all"
                                        style={{ zIndex: player.id === currentPlayerId ? 50 : 10 }}
                                    >
                                        {/* Peão 3D Compacto */}
                                        <div className={`
                                            w-10 h-10 rounded-full border-2 shadow-lg overflow-hidden bg-white
                                            ${player.id === currentPlayerId ? 'border-yellow-400 ring-2 ring-yellow-400/50 -translate-y-2' : 'border-white'}
                                            transition-transform duration-300
                                        `}>
                                            {player.avatar && player.avatar.startsWith('http') ? (
                                                <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold">
                                                    {player.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        {/* Indicador de Vez */}
                                        {player.id === currentPlayerId && (
                                            <motion.div 
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="absolute -top-3 left-1/2 -translate-x-1/2"
                                            >
                                                <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_5px_#facc15]"></div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* CONTROLES FLUTUANTES (DADOS) */}
            <div className="absolute bottom-24 left-0 right-0 px-6 z-20 flex justify-center pointer-events-none">
                <div className="w-full max-w-md pointer-events-auto">
                    <DiceRoller 
                        onRoll={onRollDice} 
                        disabled={diceCooldown || !roomData.gameStarted || (roomData.gameStarted && !isMyTurn)} 
                        isMyTurn={isMyTurn}
                    />
                </div>
            </div>
            
            {/* Efeito de Vinheta para Foco */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/40" />
        </div>
    );
};
