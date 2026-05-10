import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  DollarSign, TrendingUp,
  Users, Bell, Plus, 
  Landmark, Building, Home, Unlock, 
  Hammer, Dices, HandCoins, Skull, 
  Sparkles, Gavel, Siren, 
  Backpack, Star, Play, 
  ArrowRightLeft, Handshake, 
  CheckCircle2, Loader2,
  Settings, Vote, LogOut, ChevronRight, CreditCard,
  ThumbsUp, ThumbsDown, Ban, Ghost, AlertTriangle, ShieldAlert,
  Megaphone, Building2, Send, Flag,
  Trophy, Bus, Fuel, ShoppingBag, Utensils, Warehouse, X, Snowflake, Lock,
  LayoutDashboard, MapPinned, ScrollText, SkipForward, Activity, MessageCircle, Trash2, Maximize, WifiOff
  , Gauge, TrendingDown, Info, Mic, MicOff, Map
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import Confetti from 'react-confetti';
import CountUp from 'react-countup';
import { AnimatePresence } from 'framer-motion';
import { socket } from './socket'; // Importa a conexão Socket.IO

import AuthScreen from './AuthScreen'; // Import the new AuthScreen component
import MainMenu from './MainMenu'; // Import MainMenu component
import LoadingScreen from './LoadingScreen'; // Import LoadingScreen
import CompactModal from './CompactModal'; // Import CompactModal
import ReconnectingOverlay from './ReconnectingOverlay'; // Import ReconnectingOverlay
import PingDetailsModal from './PingDetailsModal'; // Import PingDetailsModal
import AdminModal from './AdminModal'; // Import AdminModal
import AuctionModal from './AuctionModal'; // Import AuctionModal
import StartGameModal from './StartGameModal'; // Import StartGameModal
import CentralBankDashboard from './CentralBankDashboard'; // Import CentralBankDashboard
import ActionsTab from './ActionsTab'; // Import ActionsTab
import CityTab from './CityTab'; // Import CityTab
import PropertiesTab from './PropertiesTab'; // Import PropertiesTab
import ProfitTab from './ProfitTab'; // Import ProfitTab
import AchievementsTab from './AchievementsTab'; // Import AchievementsTab
import HistoryTab from './HistoryTab'; // Import HistoryTab
import AnimationOverlay from './AnimationOverlay'; // Import AnimationOverlay

import { PROPERTIES_DB, COLORS, NEIGHBORHOOD_SERVICES, TOURISM_IDS } from './PropertiesDB'; // Import Properties Database
import { safeNum, formatCurrency, formatInputCurrency, parseInputCurrency, vibrate } from './utils'; // Import Utilities
import { useGameSound } from './hooks/useGameSound'; // Import Game Sound Hook
import { useGameStore } from './stores/useGameStore'; // Import Zustand Store


import { DiceRoller } from './components/DiceRoller';

// --- CONFIGURAÇÃO API ---
// Usa o hostname atual para facilitar acesso via LAN ou Localhost sem mudar código
const API_URL = import.meta.env.PROD 
  ? `${window.location.origin}/api` 
  : `${window.location.protocol}//${window.location.hostname}:3000/api`;

// Helper para aplicar atualizações estilo Firestore (dot notation) em objeto JS
const applyFirestoreUpdates = (currentState, updates) => {
  // Otimização: structuredClone é mais performático que JSON.parse/stringify
  const newState = typeof structuredClone === 'function' ? structuredClone(currentState) : JSON.parse(JSON.stringify(currentState));
  
  Object.keys(updates).forEach(key => {
    const path = key.s
    plit('.');
    let target = newState;
    for (let i = 0; i < path.length - 1; i++) {
      if (target[path[i]] === undefined) target[path[i]] = {};
      target = target[path[i]];
    }
    target[path[path.length - 1]] = updates[key];
  });
  return newState;
};

// --- CONSTANTES ---
const DB_VERSION = 'imoney_v17_turns_optimized'; 
const INITIAL_BALANCE = 3000000; 
const SALARY_AMOUNT = 200000;
const BANK_START_RESERVE = 50000000;
const LOAN_LIMIT_PERCENT = 0.80;
const SELL_BANK_RATE = 0.5; 
const JAIL_BAIL = 50000;
const QUICK_CHATS = ["👍", "👎", "😂", "😭", "😡", "🤑", "🤡", "💀", "👀", "🤝", "Paga logo!", "Caloteiro!", "Troca?", "Sem dinheiro", "Vendi!", "Aff..."];

const ITEM_NAMES = {
  'habeas_corpus': 'Habeas Corpus',
  'free_buy': 'Compra Livre',
  'steal_prop': 'Usucapião',
  'black_card': 'Cartão Black'
};

// --- COMPONENTES LOCAIS ---
const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-indigo-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-fuchsia-600',
  'from-red-500 to-rose-700',
  'from-lime-500 to-green-600',
  'from-sky-500 to-indigo-600',
  'from-yellow-400 to-amber-600',
];

const UserAvatar = ({ name, avatar, size = 32, className = '' }) => {
  // Parse emoji|colorIdx format
  let emoji = name?.charAt(0) || '?';
  let gradient = AVATAR_GRADIENTS[0];

  if (avatar && avatar.includes('|')) {
    const parts = avatar.split('|');
    emoji = parts[0] || emoji;
    const colorIdx = parseInt(parts[1]) || 0;
    gradient = AVATAR_GRADIENTS[colorIdx] || AVATAR_GRADIENTS[0];
  } else if (avatar && !avatar.startsWith('http')) {
    emoji = avatar;
  }

  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="select-none drop-shadow-sm" style={{ fontSize: size * 0.55, lineHeight: 1 }}>
        {emoji}
      </span>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  // Global State (Zustand)
  const { user, setUser, activeRoomId, setActiveRoomId, players, setPlayers, roomData, setRoomData } = useGameStore();
  
  const [loading, setLoading] = useState(true);
  const [ping, setPing] = useState(0);
  const [isJoining, setIsJoining] = useState(false);
  
  // UI
  const [activeTab, setActiveTab] = useState('actions');
  const [showPropertyDetails, setShowPropertyDetails] = useState(null);
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeTarget, setTradeTarget] = useState(null);
  const [chargeTarget, setChargeTarget] = useState(null); 
  const [showBankruptcyModal, setShowBankruptcyModal] = useState(false);
  const [showLuckModal, setShowLuckModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showStartGameModal, setShowStartGameModal] = useState(false);
  const [starterName, setStarterName] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false); 
  const [showIncomingOffer, setShowIncomingOffer] = useState(null);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [supportsFullScreen, setSupportsFullScreen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showPingDetails, setShowPingDetails] = useState(false);
  const [connectionStats, setConnectionStats] = useState({ pings: [], success: 0, failed: 0 });
  const [buyPrompt, setBuyPrompt] = useState(null); // Estado para o modal de compra automática
  
  // Derived state (moved up to avoid ReferenceError in useEffect)
  const isMyTurn = !!(user && roomData.gameStarted && roomData.currentPlayerId === user.uid);
  const isAdminMode = user && user.uid === 'ADMIN';
  
  // FIX: Calcular safeMyBalance no início para uso nos Hooks (useEffect)
  const playerForBalance = user ? (isAdminMode ? { balance: roomData.bankReserve || 0 } : players[user.uid]) : null;
  const safeMyBalance = playerForBalance ? safeNum(playerForBalance.balance) : 0;

  // OTIMIZAÇÃO: useMemo para transações (evita estado duplicado)
  const transactions = useMemo(() => {
      const rawTxs = roomData.transactions || [];
      return rawTxs.map(t => ({...t, amount: safeNum(t.amount)})).sort((a,b) => b.timestamp - a.timestamp);
  }, [roomData.transactions]);

  // OTIMIZAÇÃO: useMemo para agrupamento de propriedades (evita recálculo a cada render)
  const groupedProperties = useMemo(() => PROPERTIES_DB.reduce((acc, prop) => {
      if (!acc[prop.group]) acc[prop.group] = [];
      acc[prop.group].push(prop);
      return acc;
  }, {}), []);

  // MECHANICS & ANIMATION
  const [forceBuyMode, setForceBuyMode] = useState(false);
  const [stealPropMode, setStealPropMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [animationType, setAnimationType] = useState(null); 
  const [animationDuration, setAnimationDuration] = useState(3000);
  const [animationData, setAnimationData] = useState(null);
  const [onAnimationEnd, setOnAnimationEnd] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [balanceFlash, setBalanceFlash] = useState(null);
  
  // Modals Inputs
  const { play } = useGameSound();
  const isMutedRef = useRef(false); // Ref para acesso síncrono dentro de callbacks/efeitos

  // Helper para substituir o antigo playSound e respeitar o Mute
  const playSound = useCallback((type) => {
      if (!isMutedRef.current) play(type);
  }, [play]);

  const [modalAmountStr, setModalAmountStr] = useState('');
  const [modalTarget, setModalTarget] = useState(null);
  const [modalNote, setModalNote] = useState('');
  const [loanInterest, setLoanInterest] = useState('');
  const [loanInstallments, setLoanInstallments] = useState(10);
  const [tradePlayerId, setTradePlayerId] = useState(null);
  const [tradeTargetProp, setTradeTargetProp] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  const [diceCooldown, setDiceCooldown] = useState(false);


  // REMOVIDO: const prevTransactionsRef = useRef([]); -> Não é mais necessário com a lógica do useEffect
  const lastProcessedTxId = useRef(null);
  const prevCurrentPlayerRef = useRef(null);
  const lastProcessedChatId = useRef(null);
  const prevBalanceRef = useRef(0);
  const playersRef = useRef(players); // Ref para acessar players atualizados dentro do socket

  const getInterestRate = (score) => {
      const s = score !== undefined ? score : 500;
      if (s >= 900) return 0.01;
      if (s >= 700) return 0.03;
      if (s >= 500) return 0.05;
      if (s >= 300) return 0.07;
      return 0.10;
  };



  useEffect(() => {
    // --- BLOQUEIO DE ZOOM E GESTOS NATIVOS ---
    const preventDefault = (e) => e.preventDefault();
    // Bloqueia pinch-zoom (dois dedos)
    const preventPinch = (e) => { if (e.touches.length > 1) e.preventDefault(); };
    // Bloqueia zoom via teclado/mouse
    const preventWheel = (e) => { if (e.ctrlKey) e.preventDefault(); };
    
    document.addEventListener('gesturestart', preventDefault);
    document.addEventListener('touchmove', preventPinch, { passive: false });
    document.addEventListener('wheel', preventWheel, { passive: false });

    return () => {
        document.removeEventListener('gesturestart', preventDefault);
        document.removeEventListener('touchmove', preventPinch);
        document.removeEventListener('wheel', preventWheel);
    };
  }, []);

  useEffect(() => {
    setSupportsFullScreen(!!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen));
  }, []);

  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) { wakeLock = await navigator.wakeLock.request('screen'); }
      } catch (err) { console.log(err); }
    };
    if (activeRoomId) requestWakeLock();
    return () => { if (wakeLock) wakeLock.release(); };
  }, [activeRoomId]);

  useEffect(() => {
    // Load initial room ID from local storage
    const storedRoomId = localStorage.getItem('imoney_room_id');
    if (storedRoomId) setActiveRoomId(storedRoomId);

    // Auth verdadeiro
    try {
        const token = localStorage.getItem('imoney_token');
        const storedUser = localStorage.getItem('imoney_user');
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
    } catch (e) {
        setUser(null);
    }
    setLoading(false);
  }, []);

  // --- BALANCE FLASH EFFECT ---
  useEffect(() => {
      if (prevBalanceRef.current !== undefined) {
          if (safeMyBalance > prevBalanceRef.current) {
              setBalanceFlash('green'); setTimeout(() => setBalanceFlash(null), 800);
          } else if (safeMyBalance < prevBalanceRef.current) {
              setBalanceFlash('red'); setTimeout(() => setBalanceFlash(null), 800);
          }
      }
      prevBalanceRef.current = safeMyBalance;
  }, [safeMyBalance]);

  // Mantém a ref de players atualizada
  useEffect(() => { playersRef.current = players; }, [players]);

  // Sincroniza Mute com Ref para uso no playSound
  useEffect(() => {
      isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (!user || !activeRoomId) return;
    
    let isMounted = true;
    let timeoutId = null;

    const fetchGameState = async () => {
      try {
        const start = Date.now();
        const res = await fetch(`${API_URL}/room/${activeRoomId}`);
        const latency = Date.now() - start;
        
        if (res.ok) {
            setConnectionStats(prev => ({ ...prev, success: prev.success + 1, pings: [...prev.pings, latency].slice(-20) }));
            setPing(latency);
            setIsOffline(false);
        } else { throw new Error("Status " + res.status); }

        if (!isMounted) return;
        const data = await res.json();
        
        // FIX: Se a sala não existe mais (retornou vazio), sai da sala imediatamente
        if (!data || Object.keys(data).length === 0) {
             setActiveRoomId('');
             localStorage.removeItem('imoney_room_id');
             return;
        }

        // Auto-logout se o jogador não estiver na sala (ex: reset do servidor)
        if (data.players && !data.players[user.uid] && user.uid !== 'ADMIN') {
             setActiveRoomId('');
             localStorage.removeItem('imoney_room_id');
             return;
        }

        setPlayers(data.players || {});
        setRoomData(data);
        
        if (data.winner) setShowWinnerModal(true);

        // Turno
        if (data.currentPlayerId && prevCurrentPlayerRef.current !== data.currentPlayerId) {
             prevCurrentPlayerRef.current = data.currentPlayerId;
             if (data.currentPlayerId === user.uid) {
                 // Pequeno delay para garantir que não sobreponha outras notificações
                 setTimeout(() => {
                     toast.success('SUA VEZ! É hora de jogar.');
                     playSound('turn');
                     vibrate([200, 100, 200]);
                     triggerAnimation('your_turn', null, 2000);
                 }, 500);
             }
        }


        const myPendingOffer = (data.offers || []).find(o => o.to === user.uid && o.status === 'pending');
        setShowIncomingOffer(myPendingOffer || null);

        // REMOVIDO: Lógica de start_game movida para o useEffect de transactions
        
      } catch (e) { 
          console.error("Erro ao buscar estado:", e);
          setConnectionStats(prev => ({ ...prev, failed: prev.failed + 1 }));
          setIsOffline(true);
      }
      finally {
        if (isMounted) timeoutId = setTimeout(fetchGameState, 1000); // Polling adaptativo (1s)
      }
    };

    fetchGameState(); // Busca inicial
    return () => { isMounted = false; if (timeoutId) clearTimeout(timeoutId); };
  }, [user, activeRoomId]);

  // --- SOCKET.IO LISTENERS ---
  useEffect(() => {
    if (!activeRoomId || !user) return;

    socket.emit('join_room', { roomId: activeRoomId, userId: user.uid });

    const onRoomUpdate = (payload) => {
      // Só atualiza se a notificação for da minha sala
      if (payload.roomId === activeRoomId) {
        setRoomData(payload.data);
        setPlayers(payload.data.players || {});

        // Verifica mudança de turno instantânea
        if (payload.data.currentPlayerId && prevCurrentPlayerRef.current !== payload.data.currentPlayerId) {
             prevCurrentPlayerRef.current = payload.data.currentPlayerId;
             if (payload.data.currentPlayerId === user.uid) {
                 setTimeout(() => {
                     toast.success('SUA VEZ! É hora de jogar.');
                     playSound('turn');
                     vibrate([200, 100, 200]);
                     triggerAnimation('your_turn', null, 2000);
                 }, 500);
             }
        }
      }
    };

    const onPropertyBought = (data) => {
      if (data.roomId === activeRoomId && data.playerName !== user.name) {
        toast.info(`${data.playerName} comprou ${data.propName}`);
      }
    };

    const onChatNewMessage = (data) => {
        if (data.roomId === activeRoomId && data.chat.senderId !== user.uid) {
            toast.message(data.chat.senderName, { description: data.chat.content, icon: <MessageCircle size={16}/> });
        }
    };

    const onDiceRolled = (data) => {
        if (data.roomId === activeRoomId) {
            // --- VIBRAÇÃO TÁTIL (HAPTIC FEEDBACK) ---
            if (data.result === 12) vibrate([100, 50, 100, 50, 500]); // 6+6 (Épico)
            else if (data.result === 2) vibrate([50, 300]); // 1+1 (Snake eyes)
            else if (data.die1 === data.die2) vibrate([100, 100, 100]); // Duplos
            else vibrate(100); // Normal

            // Se eu estou esperando resultado para aluguel (modal aberto) e fui eu que joguei
            if (data.userId === user.uid && showDiceModal) {
                setDiceResult(data.result);
                setIsRolling(false);
            } else {
                // Caso contrário (movimento ou outro jogador), mostra animação na tela
                const pName = playersRef.current[data.userId]?.name || 'Jogador';
                triggerAnimation('dice_result', null, 4000, { 
                    die1: data.die1, 
                    die2: data.die2, 
                    playerName: pName,
                    result: data.result
                });
                playSound('click');
            }
        }
    };

    const onCardDrawn = (data) => {
        // Se for automático (dados iguais), mostra para todos, inclusive eu. Se for manual, só para os outros.
        // FIX: Ignora Visita e Feriado aqui para evitar animação duplicada (já tratada em handleBoardEvent ou transactions)
        if (data.roomId === activeRoomId && (data.userId !== user.uid || data.isAuto || isAdminMode) && !['Visita Social', 'Feriado'].includes(data.card.note)) {
             let animType = (data.card.type === 'luck' || data.card.type === 'item') ? 'luck_anim' : 'setback_anim';
             
             // Verifica se é ÉPICO (>= 1 Milhão) E se é SORTE (para não comemorar revés)
             if (data.card.amount >= 1000000 && data.card.type === 'luck') {
                 animType = 'epic_anim';
             }

             triggerAnimation(animType, () => {
                 // Callback após a animação: Abre o modal se for automático e for eu
                 if (data.isAuto && data.userId === user.uid) {
                     setCurrentCard(data.card);
                     setCardRevealed(true);
                     setShowLuckModal(true);
                     playSound('notification');
                 }
             }, 4000, { 
                 title: data.card.title, 
                 text: data.card.text, 
                 playerName: data.playerName,
                 amountStr: data.card.amount ? formatCurrency(data.card.amount) : null
             });
             playSound((animType === 'luck_anim' || animType === 'epic_anim') ? 'income' : 'expense');
        }
    };

    const onServerNotification = (data) => {
        toast(data.title, { description: data.msg, type: data.type === 'expense' ? 'error' : 'success' });
    };

    const onPlayerTyping = ({ userId, isTyping }) => {
        setTypingUsers(prev => {
            const newState = { ...prev };
            if (isTyping) newState[userId] = true;
            else delete newState[userId];
            return newState;
        });
    };

    const onPlayerPresence = ({ userId, online }) => {
        if (userId === user.uid) return;
        const pName = playersRef.current[userId]?.name || 'Jogador';
        toast(`${pName} ${online ? 'entrou' : 'saiu'}`);
    };

    const onPromptBuyProperty = (data) => {
        setBuyPrompt(data);
        playSound('notification');
    };

    socket.on('room_update', onRoomUpdate);
    socket.on('property_bought', onPropertyBought);
    socket.on('chat_new_message', onChatNewMessage);
    socket.on('dice_rolled', onDiceRolled);
    socket.on('player_typing', onPlayerTyping);
    socket.on('player_presence', onPlayerPresence);
    socket.on('card_drawn', onCardDrawn);
    socket.on('server_notification', onServerNotification);
    socket.on('prompt_buy_property', onPromptBuyProperty);

    return () => {
      socket.off('room_update', onRoomUpdate);
      socket.off('property_bought', onPropertyBought);
      socket.off('chat_new_message', onChatNewMessage);
      socket.off('dice_rolled', onDiceRolled);
      socket.off('player_typing', onPlayerTyping);
      socket.off('player_presence', onPlayerPresence);
      socket.off('card_drawn', onCardDrawn);
      socket.off('server_notification', onServerNotification);
      socket.off('prompt_buy_property', onPromptBuyProperty);
    };
  }, [activeRoomId, user, showDiceModal]); // Adicionado showDiceModal para decidir onde mostrar o dado

  // --- PROCESSADOR DE TRANSAÇÕES (FEEDBACK VISUAL) ---
  useEffect(() => {
      if (transactions.length === 0) return;
      
      // Inicializa o ponteiro na primeira carga para evitar spam de notificações antigas
      if (lastProcessedTxId.current === null) {
          lastProcessedTxId.current = transactions[0].id;
          return;
      }

      // Identifica TODAS as novas transações desde a última renderização
      const newTransactions = [];
      for (const tx of transactions) {
          if (tx.id === lastProcessedTxId.current) break;
          newTransactions.push(tx);
      }
      
      if (newTransactions.length === 0) return;
      
      // Atualiza o ID da última processada para a mais recente (índice 0)
      lastProcessedTxId.current = transactions[0].id;

      // Processa da mais antiga para a mais nova para ordem lógica das notificações
      // Mas prioriza animações de eventos sobre 'pass_turn'
      const reversedTxs = [...newTransactions].reverse();
      
      // Verifica se houve algum evento importante neste lote para suprimir animação de "Passar Vez"
      const hasMajorEvent = reversedTxs.some(t => 
          t.description.includes('Receita Federal') || 
          t.description.includes('Natal') || 
          t.type === 'global_earthquake' ||
          t.type === 'bankrupt'
      );

      reversedTxs.forEach(latest => {
          const isMe = latest.to === user.uid || latest.from === user.uid;
          const isPayer = latest.from === user.uid;
          const isReceiver = latest.to === user.uid;

          // Lógica de Notificações e Animações Centralizada
          if (latest.type === 'bankrupt') {
              toast.error(`FALÊNCIA! ${latest.senderName} saiu do jogo!`);
              if (isPayer) triggerAnimation('bankrupt_anim', null, 4000);
          } else if (latest.description.includes("Penhora") || latest.description.includes("CADEIA")) {
              toast.error(latest.description);
          } else if (latest.type === 'start_game') {
              toast.success('JOGO INICIADO!');
              playSound('notification');
              triggerAnimation('start_game', null, 2500);
              if (roomData.players && roomData.currentPlayerId) {
                  setStarterName(roomData.players[roomData.currentPlayerId]?.name || 'Jogador');
                  setShowStartGameModal(true);
              }
          } else if (latest.type === 'vote_restart') {
              playSound('notification');
          }

          // --- CONFETTI TRIGGERS ---
          if (isPayer && latest.type === 'buy_prop' && latest.amount >= 500000) {
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 6000);
          }
          if (latest.type === 'end_auction' && latest.description.includes(myPlayer.name) && latest.description.includes('vendido')) {
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 6000);
          }
          
          if (isPayer && latest.type === 'buy_prop') {
              triggerAnimation('buy'); playSound('income'); vibrate(50);
          } else if ((isPayer || isReceiver) && latest.type === 'accept_offer') {
              triggerAnimation('sell'); playSound('income'); vibrate([50, 50]);
          } else if ((isPayer || isReceiver) && latest.type === 'offer_rejected') {
              triggerAnimation('reject'); playSound('expense'); vibrate(200);
          } else if (isPayer && latest.type === 'build') {
              triggerAnimation('construct'); playSound('build'); vibrate([30, 30, 30]);
          } else if (isPayer && latest.type === 'go_to_jail') {
              triggerAnimation('jail'); playSound('bankrupt'); vibrate([500, 200, 500]);
          } else if (isPayer && (latest.type === 'pay_bail' || latest.type === 'use_habeas_corpus' || latest.type === 'free_jail')) {
              triggerAnimation('jail_open'); playSound('income'); vibrate(100);
          } else if ((isPayer || isReceiver) && latest.type === 'loan_take') {
              triggerAnimation('loan'); playSound('income'); vibrate(100);
          } else if (latest.type === 'pass_turn') {
              // Só toca animação de passar a vez se NÃO houver um evento maior junto
              if (!hasMajorEvent) {
                  if (latest.description.includes('Fiança Forçada') && players[user.uid] && latest.description.includes(players[user.uid].name)) {
                      triggerAnimation('jail_open'); playSound('income'); vibrate(100);
                  } else if (isPayer) {
                      triggerAnimation('turn_pass', null, 1500); playSound('click'); vibrate(50);
                  }
              }
          } else if (latest.type === 'global_earthquake') {
              triggerAnimation('earthquake', null, 4000);
              playSound('bankrupt'); 
              vibrate([500, 100, 500, 100, 500]); 
          } else if (isPayer && (latest.description.includes('Receita Federal') || latest.description.includes('Imposto'))) { 
              triggerAnimation('tax', null, 3000, { text: 'Receita Federal' }); playSound('expense'); vibrate(300);
          } else if (isReceiver && (latest.description.includes('Restituição') || latest.description.includes('Reembolso'))) {
              triggerAnimation('refund'); playSound('income'); vibrate([50, 50, 50]);
          } else if (isReceiver && latest.description.includes('Natal')) {
              triggerAnimation('rent_receive', null, 4000, { text: 'Bônus de Natal', amount: formatCurrency(latest.amount) }); 
              playSound('income');
              vibrate([50, 50, 50, 50]);
          } else if (latest.description.includes('Visita')) {
              if (latest.type === 'event' && !isMe) {
                  triggerAnimation('visit', null, 2000);
              } else if (latest.type === 'income') {
                  playSound('income');
                  toast.success(`Visita Social: ${latest.receiverName || 'Alguém'} recebeu ${formatCurrency(latest.amount)}`);
              }
          } else if (latest.description.includes('Feriado')) {
              if (latest.type === 'event' && !isMe) {
                  triggerAnimation('plane', null, 2000);
              } else if (latest.type === 'expense') {
                  playSound('expense');
                  toast.error(`Feriado: ${latest.senderName || 'Alguém'} pagou ${formatCurrency(latest.amount)}`);
              }
          } else if (latest.type === 'charge_rent' || latest.type === 'pay_rent') {
              if (isPayer) { triggerAnimation('rent_pay'); playSound('expense'); vibrate(200); }
              else if (isReceiver) { 
                  let propName = (latest.note || 'Imóvel').replace(/^(Aluguel( Cia)?|Cia)[:\s]*\s*/i, '');
                  triggerAnimation('rent_receive', null, 4000, { text: propName, amount: formatCurrency(latest.amount) }); 
                  playSound('income'); vibrate([50, 50, 50, 50]); 
              }
          } else if (latest.type === 'claim_achievement' && isReceiver) {
              triggerAnimation('achievement', null, 4000, { title: latest.note, reward: formatCurrency(latest.amount) }); 
              playSound('income'); 
              vibrate([100, 50, 100, 50, 100]);
          } else if (latest.type === 'start_auction') {
              triggerAnimation('auction_start', null, 3000, { item: latest.note });
              playSound('notification'); 
              vibrate([100, 100, 100]);
          } else if (latest.type === 'end_auction') {
              if (latest.description.includes('vendido')) {
                  triggerAnimation('auction_sold');
                  playSound('income');
              } else {
                  triggerAnimation('reject');
                  playSound('expense');
              }
          } else if (latest.type === 'add_inventory' && isReceiver) {
              toast.success(`Item Recebido: ${ITEM_NAMES[latest.note] || latest.note}`);
              vibrate([50, 50]);
          } else if (latest.type === 'make_offer' && isPayer) {
              toast.success('Proposta Enviada. Aguarde a resposta.');
          } else if (isPayer && (latest.type === 'sell_house' || latest.type === 'sell_bank')) {
              triggerAnimation('sell'); playSound('income'); vibrate(50);
          } else if (isPayer && latest.type === 'mortgage_prop') {
              triggerAnimation('lock'); playSound('click'); vibrate(50);
          } else if (isPayer && latest.type === 'unmortgage_prop') {
              triggerAnimation('unlock'); playSound('income'); vibrate(50);
          } else if (isPayer && latest.type === 'loan_pay') {
              triggerAnimation('loan_pay_anim'); playSound('income'); vibrate(50);
          } else if (isPayer && latest.type === 'pay_private_debt') {
              triggerAnimation('debt_pay_anim'); playSound('expense'); vibrate(50);
          } else if (isMe && (latest.type === 'income' || latest.type === 'expense' || latest.type === 'pay_all' || latest.type === 'receive_all' || latest.type === 'pay_loan_percent')) {
              if (!latest.description.includes('Visita') && !latest.description.includes('Feriado')) {
                  if (latest.type === 'expense') 
                    toast.error(`${latest.description}: -${formatCurrency(latest.amount)}`);
                  else {
                    toast.success(`${latest.description}: +${formatCurrency(latest.amount)}`);
                    vibrate([50, 50, 50]); // Haptic Feedback for Income
                  }
              }
          } else if (latest.type === 'pay_bank_rent' && isPayer) {
              triggerAnimation('tax', null, 3000, { text: 'Taxa Administrativa' }); playSound('expense'); vibrate(200);
          } else if (latest.type === 'admin_seize_prop') {
              triggerAnimation('seized', null, 4000);
              playSound('bankrupt');
          } else if (latest.type === 'event') {
              toast(latest.note, { description: latest.description });
              playSound('click');

          } else if (isMe && latest.type === 'pay_all') {
              triggerAnimation('community_expense', null, 3000);
              playSound('expense');
          } else if (isMe && latest.type === 'receive_all') {
              triggerAnimation('community_income', null, 3000);
              playSound('income');
          }
      });
  }, [transactions, user, players, roomData]);

  useEffect(() => {
      if (!showDiceModal) { setDiceResult(null); setIsRolling(false); }
      if (!showNegotiationModal) { setModalAmountStr(''); setModalTarget(null); setModalNote(''); setLoanInterest(''); }
      if (!showLoanModal) { setModalAmountStr(''); setLoanInstallments(6); }
      if (!showOfferModal) { setModalAmountStr(''); }
      if (!showLuckModal) { setCardRevealed(false); }
  }, [showDiceModal, showNegotiationModal, showLoanModal, showOfferModal, showLuckModal]);

  
  const triggerAnimation = (type, callback = null, duration = 3000, data = null) => {
      setAnimationType(type);
      setAnimationDuration(duration);
      setAnimationData(data);
      setOnAnimationEnd(() => callback);
  };
  
  const handleAnimationComplete = () => {
      setAnimationType(null);
      setAnimationData(null);
      if (onAnimationEnd) {
          onAnimationEnd();
          setOnAnimationEnd(null);
      }
  };

  const doFeedback = (type) => { playSound(type || 'click', isMuted); vibrate(10); };

  const enterFullScreen = () => {
      try {
          const elem = document.documentElement;
          if (elem.requestFullscreen) elem.requestFullscreen();
          else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      } catch (e) { console.log(e); }
  };

  const toggleFullScreen = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          enterFullScreen();
      } else {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
  };

  const handleResetRoom = async () => {
    if (!window.confirm("ATENÇÃO: Isso apagará a sala e todos os dados de todos os jogadores permanentemente. Continuar?")) return;
    try {
        await fetch(`${API_URL}/room/${activeRoomId}`, { method: 'DELETE' });
        setActiveRoomId('');
        localStorage.removeItem('imoney_room_id');
        setPlayers({});
        setRoomData({});
    } catch (e) {
        console.error(e);
        alert("Erro ao apagar sala.");
    }
  };

  const handleAdminResetServer = async () => {
    if (!window.confirm("PERIGO: Isso apagará TODAS as salas e dados do servidor. Continuar?")) return;
    try {
        const res = await fetch(`${API_URL}/admin/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: '@Matheus6584' })
        });
        const data = await res.json();
        if (data.success) { alert("Servidor resetado com sucesso."); window.location.reload(); } 
        else { alert("Erro: " + (data.error || "Desconhecido")); }
    } catch (e) { alert("Erro de conexão com o servidor."); }
  };

  const handleSendChat = async (content) => {
    if (!user || !activeRoomId) return;
    socket.emit('send_message', { roomId: activeRoomId, userId: user.uid, content });
    // Para de digitar imediatamente ao enviar
    socket.emit('typing', { roomId: activeRoomId, userId: user.uid, isTyping: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleChatInputChange = (e) => {
      setChatInput(e.target.value);
      if (activeRoomId && user) {
          socket.emit('typing', { roomId: activeRoomId, userId: user.uid, isTyping: true });
          
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
              socket.emit('typing', { roomId: activeRoomId, userId: user.uid, isTyping: false });
          }, 2000);
      }
  };

  const handleRollDice = () => {
      if (!user || !activeRoomId) return;
      if (diceCooldown) return; // Evita cliques duplos

      setDiceCooldown(true);
      playSound('dice'); // Toca o som de dados (certifique-se de ter configurado no utils.js ou use 'click')
      socket.emit('roll_dice', { roomId: activeRoomId, userId: user.uid });
      
      setTimeout(() => setDiceCooldown(false), 3000); // Reabilita após 3 segundos
  };



  const handlePayLoan = async (amount) => {
      if (isProcessing) return;
      setIsProcessing(true);
      
      try {
          const player = players[user.uid];
          const currentDebt = safeNum(player.debt);
          const isFullPayment = amount >= currentDebt;
          
          let finalPayment = amount;
          let discount = 0;
          
          if (isFullPayment) {
              // Amortização: Desconto baseado na taxa de juros do score
              const score = player.creditScore !== undefined ? player.creditScore : 500;
              const rate = getInterestRate(score);
              discount = Math.floor(currentDebt * rate); 
              finalPayment = currentDebt - discount;
          }

          if (player.balance < finalPayment) {
              alert(`Saldo insuficiente. Valor com desconto: ${formatCurrency(finalPayment)}`);
              setIsProcessing(false);
              return;
          }

          const updatedPlayer = {
              ...player,
              balance: player.balance - finalPayment,
              debt: isFullPayment ? 0 : Math.max(0, currentDebt - amount),
              // Correção para bug de parcelas debitando após quitação: Zera activeLoans
              activeLoans: isFullPayment ? [] : player.activeLoans
          };

          const newPlayers = { ...players, [user.uid]: updatedPlayer };
          
          // Atualiza via endpoint genérico para garantir consistência e limpar parcelas
          await fetch(`${API_URL}/room/${activeRoomId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  players: newPlayers,
                  bankReserve: (roomData.bankReserve || 0) + finalPayment
              })
          });

          toast.success(isFullPayment ? `Pago com economia de ${formatCurrency(discount)}!` : `Pago: ${formatCurrency(finalPayment)}`);
          playSound('income');
          setShowLoanModal(false);
      } catch (e) {
          console.error(e);
          alert("Erro no pagamento: " + e.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleTransaction = async (type, amount, targetId = null, note = '', propId = null) => {
    // TODO: This function is very large and handles many different transaction types.
    // Consider refactoring into smaller, dedicated functions for each transaction type
    // to improve readability and maintainability.
    // Example: _handleTransfer(data, user.uid, amount, targetId, note, pSender, pTarget, updates, liquidationNote)
    // Each sub-function would return the updates and description for its specific transaction.
    if (['bankrupt', 'quit_game', 'go_to_jail', 'force_buy', 'steal_prop', 'freeze_player', 'pass_turn', 'free_jail', 'pay_bail', 'add_inventory', 'use_inventory', 'start_game', 'vote_restart', 'reset_game', 'sell_house', 'sell_bank', 'pay_debt_percent_20', 'pay_debt_percent_50', 'loan_pay', 'use_habeas_corpus', 'use_black_card', 'pay_loan_percent', 'make_offer', 'make_trade_offer', 'accept_offer', 'reject_offer', 'pay_all', 'receive_all', 'pay_rent', 'pay_bank_rent', 'pay_private_debt', 'start_auction', 'place_bid', 'end_auction', 'claim_achievement', 'mortgage_prop', 'unmortgage_prop', 'admin_add_money', 'admin_remove_money', 'admin_seize_prop', 'admin_jail', 'admin_unjail', 'admin_kick', 'admin_freeze', 'admin_add_item', 'global_earthquake'].includes(type) === false && (!amount || amount <= 0)) return alert("Valor inválido!");
    // --- BLOQUEIO ANTES DO INÍCIO ---
    const ALLOWED_BEFORE_START = ['start_game', 'vote_restart', 'reset_game', 'admin_add_money', 'admin_remove_money', 'admin_seize_prop', 'admin_jail', 'admin_unjail', 'admin_kick', 'admin_freeze', 'admin_add_item'];
    if (!roomData.gameStarted && !ALLOWED_BEFORE_START.includes(type) && !isAdminMode) {
        toast.error('Aguarde o início da partida!');
        return;
    }

    // --- SISTEMA DE TURNOS ---
    if (roomData.gameStarted && roomData.currentPlayerId && roomData.currentPlayerId !== user.uid && !isAdminMode) {
        const RESTRICTED_ON_NOT_TURN = ['pass_turn', 'buy_prop', 'build', 'sell_house', 'sell_bank', 'add_inventory', 'use_inventory', 'pay_bank_rent', 'force_buy', 'steal_prop'];
        
        if (RESTRICTED_ON_NOT_TURN.includes(type) || (type === 'income' && note === 'Salário')) {
             toast.error('Não é sua vez! Aguarde seu turno.');
             vibrate([50, 50, 50]);
             return;
        }
    }

    // Bloqueio por Burnout (Congelado)
    if (players[user.uid]?.frozenTurns > 0 && type !== 'pass_turn') {
        toast.error('Em Burnout! Você está congelado.');
        return;
    }

    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const res = await fetch(`${API_URL}/room/${activeRoomId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: user.uid,
            type,
            amount,
            targetId,
            note,
            propId
        })
      });

      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erro na transação");
      }

      const data = await res.json();
      setPlayers(data.players || {});
      setRoomData(data);
      
      // REMOVIDO: setTransactions(cleanTxs); -> O useMemo cuidará disso na próxima renderização

      setShowNegotiationModal(false); setShowLoanModal(false); setShowTradeModal(false); setShowPropertyDetails(null); setShowDiceModal(false); setShowBankruptcyModal(false); setShowLuckModal(false); setShowOfferModal(false); setShowIncomingOffer(null); setShowStartGameModal(false);
      setForceBuyMode(false); setStealPropMode(false); setShowSettingsModal(false);
      
    } catch (e) {
        if (e.message.includes("FALÊNCIA")) { setShowBankruptcyModal(true); } else { toast.error(e.message); }
    } finally { setIsProcessing(false); }
  };

  const getRent = (prop, currentRoomData) => {
      let currentRent = prop.rent;
      const ownerId = Object.keys(players).find(uid => players[uid].properties?.includes(prop.id));
      
      if (ownerId) {
          const owner = players[ownerId];
          
          // Se estiver hipotecado, não cobra aluguel
          if ((owner.mortgaged || []).includes(prop.id)) return 0;

          const houses = (owner.houses || {})[prop.id] || 0;
          
          if (prop.group !== 'company' && prop.group !== 'special') {
              if (houses === 1) currentRent = prop.rent1;
              else if (houses === 2) currentRent = prop.rent2;
              else if (houses === 3) currentRent = prop.rent3;
              else if (houses === 4) currentRent = prop.rent4;
              else if (houses >= 5) currentRent = prop.rentHotel;
          }

          // Bônus de Vizinhança (Desbloqueáveis)
          const serviceConf = NEIGHBORHOOD_SERVICES[prop.group];
          if (serviceConf) {
              const groupProps = PROPERTIES_DB.filter(p => p.group === prop.group);
              let totalHousesInGroup = 0;
              groupProps.forEach(p => { if (owner.properties?.includes(p.id)) totalHousesInGroup += (owner.houses?.[p.id] || 0); });

              let multiplier = 1;
              if (serviceConf.level2 && totalHousesInGroup >= serviceConf.level2.threshold) multiplier += (serviceConf.level2.bonus || 0);
              else if (serviceConf.level1 && totalHousesInGroup >= serviceConf.level1.threshold) multiplier += (serviceConf.level1.bonus || 0);
              
              currentRent = currentRent * multiplier;
          }
      }



      return Math.floor(currentRent);
  };

  const rollDiceForRent = () => {
      setIsRolling(true); 
      playSound('click'); 
      triggerAnimation('dice', () => { 
          socket.emit('roll_dice', { roomId: activeRoomId, userId: user.uid });
          // O resultado virá pelo evento 'dice_rolled'
      }, 2000); 
  };
  const processCardEffect = () => { 
      if (!currentCard) return; 
      const desc = currentCard.note || (currentCard.type === 'luck' ? `Sorte: ${currentCard.title}` : `Revés: ${currentCard.title}`); 
      const amount = safeNum(currentCard.amount);
      
      if (currentCard.action === 'add_inventory') handleTransaction('add_inventory', 0, null, currentCard.itemId); 
      else if (currentCard.action === 'receive_bank') handleTransaction('income', amount, null, desc); 
      else if (currentCard.action === 'pay_bank') handleTransaction('expense', amount, null, desc); 
      else if (currentCard.action === 'go_to_jail') handleTransaction('go_to_jail', 0); 
      else if (currentCard.action === 'pass_turn') handleTransaction('pass_turn', 0);
      else if (currentCard.action === 'freeze_player') handleTransaction('freeze_player', 0); 
      else if (currentCard.action === 'pay_loan_percent') handleTransaction('pay_loan_percent', amount, null, `Revés: ${currentCard.title}`); 
      else if (currentCard.action === 'repairs_house') { 
          const myHouses = players[user.uid]?.houses || {}; 
          let totalHouses = 0; 
          Object.values(myHouses).forEach(h => totalHouses += h); 
          const cost = totalHouses * amount; 
          if (cost > 0) {
              handleTransaction('expense', cost, null, `Revés: ${currentCard.title} ( casas)`); 
          } else {
              toast.success('Ufa! Você não possui casas para reformar.');
          }
      } 
      else if (currentCard.action === 'pay_all') handleTransaction('pay_all', amount, null, currentCard.title); 
      else if (currentCard.action === 'receive_all') handleTransaction('receive_all', amount, null, currentCard.title); 
      
      setShowLuckModal(false); 
  };
  
  const handleBoardEvent = async (type) => {
      if (isProcessing) return;
      setIsProcessing(true);
      try {
          const res = await fetch(`${API_URL}/room/${activeRoomId}/board-event`, { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, userId: user.uid })
          });
          if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Erro no evento"); }
          const card = await res.json();
          
          let anim = type === 'feriado' ? 'plane' : 'visit';
          
          setCurrentCard(card);
          playSound('click');
          
          if (type === 'feriado') vibrate(200);
          else vibrate([50, 50]);
          
          triggerAnimation(anim, () => { setCardRevealed(true); setShowLuckModal(true); }, 2000);
      } catch (e) {
          console.error(e);
          alert(e.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const useInventoryItem = (itemId) => { 
      if (itemId === 'free_buy') { setForceBuyMode(true); setShowInventoryModal(false); setActiveTab('properties'); toast.success('Compra Livre Ativada! Selecione um imóvel.'); } 
      else if (itemId === 'steal_prop') { setStealPropMode(true); setShowInventoryModal(false); setActiveTab('properties'); toast.success('Modo Ladrão Ativado! Selecione um imóvel para roubar.'); }
      else if (itemId === 'habeas_corpus') { if (players[user.uid].isJailed) { handleTransaction('use_habeas_corpus'); setShowInventoryModal(false); } else { alert("Você não está preso!"); } } 
      else if (itemId === 'black_card') { if (players[user.uid].debt > 0) { handleTransaction('use_black_card'); setShowInventoryModal(false); } else { alert("Você não possui dívidas com o banco!"); } }
  };

  const drawCard = async () => {
      if (isProcessing) return;
      setIsProcessing(true);
      try {
          const res = await fetch(`${API_URL}/room/${activeRoomId}/draw-card`, { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.uid })
          });
          if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Erro ao sortear carta"); }
          const card = await res.json();
          
          setCurrentCard(card);
          let animType = (card.type === 'luck' || card.type === 'item') ? 'luck_anim' : 'setback_anim';
          
          if (card.amount >= 1000000 && card.type === 'luck') {
              animType = 'epic_anim';
              vibrate([100, 50, 100, 50, 500]); // Vibração Épica
          } else if (card.type === 'luck' || card.type === 'item') {
              vibrate([50, 50, 50]); // Vibração Sorte
          } else {
              vibrate(300); // Vibração Revés
          }
          
          playSound('click');
          triggerAnimation(animType, () => { setCardRevealed(true); }, 2000);
      } catch (e) {
          console.error(e);
          alert(e.message);
      } finally {
          setIsProcessing(false);
      }
  };
  
  const hasMonopoly = (group) => { if(['company','special'].includes(group)) return false; return PROPERTIES_DB.filter(p=>p.group===group).every(p=>(players[user.uid]?.properties||[]).includes(p.id)); };
  
  // AGRUPAMENTO PARA ABA CIDADE (OTIMIZADO) -> Já movido para useMemo acima
  
  if (loading) return <div className="fixed inset-0 bg-[#1a1b23]"><LoadingScreen message="Carregando..." /></div>;
  
  if (!user) {
    return (
      <AuthScreen
        setUser={setUser}
        API_URL={API_URL}
        onOpenAdmin={() => setUser({ uid: 'ADMIN', name: 'Banco Central', avatar: '🏦' })}
      />
    );
  }

  if (!activeRoomId) {
    return (
      <MainMenu
        user={user}
        setUser={setUser}
        setActiveRoomId={setActiveRoomId}
        API_URL={API_URL}
        INITIAL_BALANCE={INITIAL_BALANCE}
        BANK_START_RESERVE={BANK_START_RESERVE}
        onOpenAdmin={() => setUser({ uid: 'ADMIN', name: 'Banco Central', avatar: '🏦' })}
        playSound={playSound}
      />
    );
  }

  if (!players[user.uid] && !isAdminMode) return <div className="fixed inset-0 bg-[#1a1b23]"><LoadingScreen message="Sincronizando carteira..." /></div>;

  const myPlayer = isAdminMode ? { name: 'Banco Central', balance: roomData.bankReserve || 0, debt: 0, assets: 0, inventory: [] } : players[user.uid];
  const myDebt = safeNum(myPlayer.debt);
  const myEquity = safeNum(myPlayer.assets); 
  const totalAssetsValue = safeMyBalance + myEquity;
  const myScore = myPlayer.creditScore !== undefined ? myPlayer.creditScore : 500;
  const netWorth = totalAssetsValue - myDebt;
  const isBankrupt = netWorth < 0; 
  const isJailed = myPlayer.isJailed === true;
  const isFrozen = (myPlayer.frozenTurns || 0) > 0;
  const myInventory = myPlayer.inventory || []; 
  const loanLimit = Math.max(0, myEquity * LOAN_LIMIT_PERCENT);
  const availableCredit = Math.max(0, loanLimit - myDebt);
  const playersCount = Object.keys(players).length;
  

  
  const getScoreColor = (s) => {
      if (s >= 900) return 'text-emerald-400';
      if (s >= 700) return 'text-blue-400';
      if (s >= 500) return 'text-yellow-400';
      if (s >= 300) return 'text-orange-400';
      return 'text-red-500';
  };

  if (isAdminMode) {
      return (
          <CentralBankDashboard 
              roomData={roomData}
              players={players}
              handleTransaction={handleTransaction}
              onLogout={() => { setUser(null); setActiveRoomId(''); localStorage.removeItem('imoney_room_id'); }}
              onDrawCard={drawCard}
              onCloseRoom={async () => {
                  if (!window.confirm("ATENÇÃO: Isso apagará a sala e todos os dados permanentemente. Continuar?")) return;
                  try {
                      await fetch(`${API_URL}/room/${activeRoomId}`, { method: 'DELETE' });
                      setUser(null); setActiveRoomId(''); localStorage.removeItem('imoney_room_id');
                  } catch (e) {
                      alert("Erro ao apagar sala.");
                  }
              }}
          />
      );
  }

  return (
    <div className="fixed top-0 left-0 w-full h-[100dvh] bg-gray-50 flex flex-col font-sans select-none overflow-hidden">
      <Toaster position="top-center" richColors />
      {showConfetti && <div className="fixed inset-0 z-[100] pointer-events-none"><Confetti width={window.innerWidth} height={window.innerHeight} recycle={true} numberOfPieces={300} gravity={0.2} /></div>}
      {animationType && <AnimationOverlay type={animationType} onComplete={handleAnimationComplete} duration={animationDuration} data={animationData} />}
      {showStartGameModal && <StartGameModal starterName={starterName} onClose={()=>setShowStartGameModal(false)} />}

      {roomData.auction && roomData.auction.status === 'active' && (
        <AuctionModal 
            auction={roomData.auction} 
            players={players} 
            user={user} 
            properties={PROPERTIES_DB}
            onBid={(amount) => handleTransaction('place_bid', amount)}
            onEndAuction={() => handleTransaction('end_auction', 0, null, PROPERTIES_DB.find(p=>p.id===roomData.auction.propId)?.name)}
        />
      )}

      {/* MODAL DE COMPRA AUTOMÁTICA */}
      {buyPrompt && (
        <CompactModal title="Oportunidade de Negócio" onClose={() => setBuyPrompt(null)}>
            <div className="text-center space-y-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-xs text-emerald-600 uppercase font-bold mb-1">Imóvel Disponível</p>
                    <h2 className="text-2xl font-black text-gray-800">{buyPrompt.propName}</h2>
                    <p className="text-3xl font-mono font-black text-emerald-600 mt-2">{formatCurrency(buyPrompt.price)}</p>
                </div>
                <p className="text-sm text-gray-500">Você caiu nesta propriedade e ela não tem dono. Deseja comprar?</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setBuyPrompt(null)} className="bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm">PASSAR</button>
                    <button onClick={() => { handleTransaction('buy_prop', buyPrompt.price, null, buyPrompt.propId, buyPrompt.propId); setBuyPrompt(null); }} className="bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95">COMPRAR</button>
                </div>
            </div>
        </CompactModal>
      )}

      {isOffline && <ReconnectingOverlay />}
      {showPingDetails && (
        <PingDetailsModal onClose={() => setShowPingDetails(false)} stats={connectionStats} ping={ping} isOffline={isOffline} apiUrl={API_URL} />
      )}

      {showAdminModal && (
        <AdminModal 
            onClose={() => setShowAdminModal(false)}
            onResetServer={handleAdminResetServer}
            onResetRoom={handleResetRoom}
            onAddMoney={(amount) => handleTransaction('income', amount, null, 'Ajuste Admin')}
            activeRoomId={activeRoomId}
            API_URL={API_URL}
            roomData={roomData}
            players={players}
        />
      )}

      {(forceBuyMode || stealPropMode) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-2 animate-in slide-in-from-bottom-10 pointer-events-auto">
            <div className="bg-black/90 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-2xl flex items-center gap-3">
                <span className={`text-xs font-bold uppercase tracking-wider animate-pulse ${forceBuyMode ? 'text-emerald-400' : 'text-purple-400'}`}>
                    {forceBuyMode ? 'Modo Compra Livre' : 'Modo Usucapião'}
                </span>
                <button onClick={() => { setForceBuyMode(false); setStealPropMode(false); }} className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors active:scale-90">
                    <X size={14} />
                </button>
            </div>
            <p className="text-[10px] font-bold text-white/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Selecione um imóvel ou cancele</p>
        </div>
      )}
      
      {isFrozen && !isJailed && (
        <div className="absolute inset-0 z-[50] bg-blue-900/30 backdrop-blur-[2px] flex items-center justify-center p-6 animate-in fade-in pointer-events-none">
            <div className="bg-white p-6 rounded-3xl shadow-2xl text-center border-4 border-blue-300 pointer-events-auto">
                <Snowflake size={64} className="mx-auto text-blue-400 animate-pulse mb-4"/>
                <h2 className="text-2xl font-black text-blue-600 uppercase mb-2">BURNOUT!</h2>
                <p className="text-sm text-gray-500 mb-4">Você precisa descansar por mais <strong className="text-blue-600">{myPlayer.frozenTurns}</strong> rodadas.</p>
                {isMyTurn && <button onClick={()=>handleTransaction('pass_turn')} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition animate-bounce">PASSAR A VEZ</button>}
            </div>
        </div>
      )}

      {(isJailed || isBankrupt) && (<div className="absolute inset-0 z-[50] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-500"><div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in border-4 border-gray-300">{isBankrupt ? (<><h2 className="text-2xl font-black text-red-600 uppercase mb-2">FALÊNCIA!</h2><p className="text-sm text-gray-500 mb-6">Você não tem recursos suficientes para pagar suas dívidas.</p><button onClick={()=>handleTransaction('bankrupt')} className="w-full bg-red-600 text-white py-4 rounded-xl font-black animate-pulse">DECLARAR FALÊNCIA</button></>) : (<><h2 className="text-2xl font-black text-gray-800 uppercase mb-2">PRESO!</h2>
      {myPlayer.jailTurns > 0 ? (
          <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Pena Restante</p>
              <p className="text-3xl font-black text-red-500">{myPlayer.jailTurns}</p>
              <p className="text-xs text-gray-400 mt-1">Rodadas</p>
          </div>
      ) : (<p className="text-sm text-gray-500 mb-6">Sua pena acabou. Pague a fiança para sair.</p>)}
      {myPlayer.inventory?.includes('habeas_corpus') && <button onClick={()=>handleTransaction('use_habeas_corpus')} className="w-full bg-indigo-600 text-white py-3 rounded-xl mb-2 font-bold">USAR HABEAS CORPUS</button>}
      {myPlayer.jailTurns > 0 ? (isMyTurn ? (<button onClick={()=>handleTransaction('pass_turn')} className="w-full bg-red-600 text-white py-4 rounded-xl font-black animate-pulse">PASSAR A VEZ</button>) : (<button disabled className="w-full bg-gray-100 text-gray-400 py-4 rounded-xl font-bold cursor-not-allowed border border-gray-200">AGUARDANDO CUMPRIMENTO</button>)) : (netWorth >= JAIL_BAIL ? (<button onClick={()=>handleTransaction('pay_bail')} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black">PAGAR FIANÇA (k)</button>) : (<div className="space-y-3"><p className="text-xs font-bold text-red-500 bg-red-50 p-2 rounded">Patrimônio insuficiente para fiança!</p><button onClick={()=>handleTransaction('bankrupt')} className="w-full bg-black text-white py-4 rounded-xl font-black animate-pulse">DECLARAR FALÊNCIA</button></div>))}
      </>)}</div></div>)}

      {showIncomingOffer && (
        <div className="absolute inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className={`w-full max-w-sm bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl ${showIncomingOffer.type === 'sell' ? 'border-indigo-400/50' : (showIncomingOffer.type === 'payment' ? 'border-red-400/50' : (showIncomingOffer.type === 'loan' ? 'border-blue-400/50' : (showIncomingOffer.type === 'trade' ? 'border-purple-400/50' : 'border-yellow-400/50')))}`}>
            <div className="flex justify-center mb-4">{showIncomingOffer.type === 'payment' ? <HandCoins size={64} className="text-red-500 animate-bounce"/> : (showIncomingOffer.type === 'loan' ? <Landmark size={64} className="text-blue-500 animate-bounce"/> : (showIncomingOffer.type === 'trade' ? <ArrowRightLeft size={64} className="text-purple-500 animate-bounce"/> : <Handshake size={64} className={`${showIncomingOffer.type === 'sell' ? 'text-indigo-500' : 'text-yellow-500'} animate-bounce`}/>))}</div>
            <h2 className="text-2xl font-black text-gray-800 text-center uppercase mb-2">{showIncomingOffer.type === 'sell' ? 'Oferta de Venda!' : (showIncomingOffer.type === 'payment' ? 'Cobrança Recebida!' : (showIncomingOffer.type === 'loan' ? 'Oferta de Empréstimo' : (showIncomingOffer.type === 'trade' ? 'Proposta de Troca' : 'Proposta Recebida!')))}</h2>
            <div className="bg-gray-50/50 p-4 rounded-2xl mb-6 text-center border border-gray-100">
              <div className="flex justify-center mb-2">
                <UserAvatar name={players[showIncomingOffer.from]?.name} avatar={players[showIncomingOffer.from]?.avatar} size={48} className="border-gray-300" />
              </div>
              <p className="text-sm text-gray-500">{showIncomingOffer.type === 'sell' ? `Jogador ${players[showIncomingOffer.from]?.name} quer te vender:` : (showIncomingOffer.type === 'payment' ? `Jogador ${players[showIncomingOffer.from]?.name} está cobrando:` : (showIncomingOffer.type === 'loan' ? `Jogador ${players[showIncomingOffer.from]?.name} oferece:` : (showIncomingOffer.type === 'trade' ? `Jogador ${players[showIncomingOffer.from]?.name} propõe troca:` : `Jogador ${players[showIncomingOffer.from]?.name} quer comprar:`)))}</p>
              {showIncomingOffer.type === 'loan' ? (<><p className="text-3xl font-black text-emerald-600 my-2 font-mono">{formatCurrency(showIncomingOffer.amount)}</p><p className="text-sm text-gray-500">Juros: <span className="font-bold text-red-500">{showIncomingOffer.interest}%</span></p><p className="text-xs text-gray-400 mt-1 font-mono">Total a Pagar: {formatCurrency(showIncomingOffer.totalDue)}</p></>) : (showIncomingOffer.type === 'trade' ? (<div className="my-2 space-y-2"><div className="bg-white p-2 rounded border border-gray-200"><p className="text-[10px] text-gray-400 uppercase">Você Recebe</p><p className="font-bold text-indigo-600">{showIncomingOffer.propName}</p></div><div className="flex justify-center"><ArrowRightLeft size={16} className="text-gray-400"/></div><div className="bg-white p-2 rounded border border-gray-200"><p className="text-[10px] text-gray-400 uppercase">Você Dá</p><p className="font-bold text-indigo-600">{showIncomingOffer.tradePropName}</p></div>{showIncomingOffer.amount !== 0 && (<p className="text-sm font-bold mt-2 font-mono">{showIncomingOffer.amount > 0 ? `+ Recebe ${formatCurrency(showIncomingOffer.amount)}` : `- Paga ${formatCurrency(Math.abs(showIncomingOffer.amount))}`}</p>)}</div>) : (<><p className="text-xl font-black text-indigo-600 my-2">{showIncomingOffer.propName}</p><p className="text-sm text-gray-500">{showIncomingOffer.type === 'payment' ? 'Valor:' : 'Por:'}</p><p className="text-3xl font-black text-emerald-600 font-mono">{formatCurrency(showIncomingOffer.amount)}</p></>))}
            </div>
            <div className="grid grid-cols-2 gap-3"><button onClick={()=>handleTransaction('reject_offer', 0, showIncomingOffer.id)} className="bg-red-100 text-red-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-200 transition"><ThumbsDown size={20}/> RECUSAR</button><button onClick={()=>handleTransaction('accept_offer', 0, showIncomingOffer.id)} className="bg-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition shadow-lg animate-pulse"><ThumbsUp size={20}/> {showIncomingOffer.type === 'sell' ? 'COMPRAR' : (showIncomingOffer.type === 'payment' ? 'PAGAR' : (showIncomingOffer.type === 'loan' ? 'ACEITAR' : (showIncomingOffer.type === 'trade' ? 'TROCAR' : 'VENDER')))}</button></div>
          </div>
        </div>
      )}

      {activeTab !== 'board' && (
      <div className={`bg-[#1a1b23]/80 backdrop-blur-xl border-b border-white/10 text-white pt-safe-top px-4 pb-4 rounded-b-[2rem] shadow-xl shrink-0 z-10 transition-colors ${myDebt>0?'border-b-4 border-orange-600':''}`}>
         {roomData.activeEvents && roomData.activeEvents.length > 0 && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                {roomData.activeEvents.map(e => (
                    <div key={e.id} className="bg-red-600 text-white text-[9px] font-bold px-3 py-0.5 rounded-b-lg shadow-lg animate-in slide-in-from-top-2 flex items-center gap-1 border border-red-800">
                        <ShoppingBag size={10}/> {e.name} ({e.duration} rodadas)
                    </div>
                ))}
            </div>
         )}
         
         <div className="flex justify-between items-center mb-2 px-1 pt-2">
             <div className="flex gap-2 items-center">
                 <button onClick={()=>{setShowSettingsModal(true); doFeedback();}} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition active:scale-90 active:bg-white/30"><Settings size={16} className="text-gray-300"/></button>
                 <button onClick={()=>{setShowChatModal(true); doFeedback();}} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition active:scale-90 active:bg-white/30"><MessageCircle size={16} className="text-blue-300"/></button>

                 <button onClick={() => setShowPingDetails(true)} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-full border border-white/5 active:scale-95 active:bg-white/10 transition h-8">
                     <Activity size={10} className={ping < 150 ? "text-emerald-400" : ping < 300 ? "text-yellow-400" : "text-red-500"}/>
                     <p className="text-[10px] font-mono font-bold text-gray-400">{isOffline ? '---' : `${ping}ms`}</p>
                 </button>
             </div>
             <div className="flex gap-2 items-center">
                 <button onClick={()=>{setShowRankingModal(true); doFeedback();}} className="bg-white/10 text-gray-300 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 active:scale-95 active:bg-white/20 transition"><Trophy size={12}/> LÍDERES</button>
                 {!roomData.gameStarted && playersCount >= 2 && (<button onClick={()=>handleTransaction('start_game')} className="bg-yellow-500 text-yellow-950 px-3 py-1.5 rounded-full text-[10px] font-black animate-pulse shadow-lg flex items-center gap-1 active:scale-95 transition hover:bg-yellow-400"><Play size={10} fill="currentColor"/> INICIAR</button>)}
             </div>
         </div>

         {/* NOME E AÇÕES RÁPIDAS */}
         <div className="flex flex-wrap justify-between items-end gap-2 mb-2">
            <div className="min-w-[100px]">
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Sala {activeRoomId}</p>
                <div className="flex items-center gap-2">
                    <UserAvatar name={myPlayer.name} avatar={myPlayer.avatar} size={32} />
                    <h2 className="font-bold text-base text-white truncate max-w-[150px]">{myPlayer.name}</h2>
                </div>
            </div>
            <div className="flex gap-2 justify-end">

                {isMyTurn && (<button onClick={()=>handleTransaction('pass_turn')} className="bg-white text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black active:scale-95 transition flex items-center gap-1 shadow-lg animate-pulse hover:bg-gray-100"><SkipForward size={12} fill="currentColor"/> PASSAR</button>)}
                {myInventory.length > 0 && <button onClick={()=>{setShowInventoryModal(true); doFeedback();}} className="relative bg-indigo-500/20 text-indigo-400 p-2 rounded-full active:bg-indigo-500 active:text-white transition active:scale-90 hover:bg-indigo-500/30"><Backpack size={16}/><span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold border-2 border-[#1a1b23]">{myInventory.length}</span></button>}
                <button onClick={() => handleTransaction('income', SALARY_AMOUNT, null, 'Salário')} disabled={isProcessing || isJailed || (roomData.gameStarted && !isMyTurn)} className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-bold active:bg-emerald-500 active:text-white transition flex items-center gap-1 disabled:opacity-50 active:scale-95 hover:bg-emerald-500/30"><Plus size={12}/> SALÁRIO</button>
            </div>
         </div>

         {/* SALDO COMPACTO */}
         <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-2 mx-1 shadow-lg text-center">
             <div className={`inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 shadow-sm ${isMyTurn ? 'bg-emerald-500 text-emerald-950 animate-pulse' : 'bg-gray-700/50 text-gray-400 border border-white/5'}`}>
                {isMyTurn ? 'SUA VEZ DE JOGAR!' : (roomData.currentPlayerId ? `VEZ DE: ${players[roomData.currentPlayerId]?.name}` : 'Aguardando Início')}
             </div>
             {isFrozen && (
                 <div className="inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-1 shadow-sm bg-blue-500 text-white ml-2 animate-pulse">
                    ❄️ BURNOUT ({myPlayer.frozenTurns})
                 </div>
             )}
             <h1 className={`text-3xl font-black tracking-tight mb-1 font-mono transition-all duration-300 ${balanceFlash === 'green' ? 'text-emerald-400 scale-110' : (balanceFlash === 'red' ? 'text-red-400' : 'text-white')}`}>
                <CountUp 
                    end={safeMyBalance} 
                    prefix="$ " 
                    separator="." 
                    duration={1.5} 
                />
             </h1>
             <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-3">Saldo Disponível</p>

             <div className="flex justify-center items-center gap-6 border-t border-white/5 pt-3">
                 <div className="text-center"><p className="text-[8px] text-gray-400 uppercase font-bold">Patrimônio</p><p className="text-white font-bold text-xs font-mono">{formatCurrency(totalAssetsValue)}</p></div>
                 <div className="w-px h-6 bg-white/10"></div>
                 <div className="text-center"><p className="text-[8px] text-gray-400 uppercase font-bold">Dívidas</p><p className={`${myDebt > 0 ? 'text-red-400' : 'text-gray-500'} font-bold text-xs font-mono`}>{myDebt > 0 ? '-' : ''}{formatCurrency(myDebt)}</p></div>
             </div>
         </div>

         {/* NOVO LAYOUT DE STATUS (GRID INFERIOR) */}
         <div className="grid grid-cols-3 gap-2">
             <button onClick={() => setShowScoreModal(true)} className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-xl active:scale-95 transition hover:bg-white/10">
                 <div className="flex items-center gap-1 mb-1">
                    <Gauge size={12} className={getScoreColor(myScore)}/>
                    <span className="text-[8px] text-gray-400 uppercase font-bold">Score</span>
                 </div>
                 <p className={`text-xs font-black ${getScoreColor(myScore)}`}>{myScore}</p>
             </button>
             


             <div className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-xl">
                 <div className="flex items-center gap-1 mb-1">
                    <Landmark size={12} className="text-emerald-400"/>
                    <span className="text-[8px] text-gray-400 uppercase font-bold">Reserva</span>
                 </div>
                 <p className="text-[10px] font-mono font-bold text-emerald-300 truncate w-full text-center">{formatCurrency(roomData.bankReserve)}</p>
             </div>
         </div>
      </div>
      )}

      <div className={`flex-1 overflow-y-auto custom-scrollbar touch-pan-y ${activeTab === 'board' ? 'p-0 overflow-hidden' : 'px-4 pt-3 pb-32'}`}>
        <AnimatePresence mode="wait">
        {activeTab === 'actions' && (
            <ActionsTab 
                isProcessing={isProcessing}
                isJailed={isJailed}
                roomData={roomData}
                isMyTurn={isMyTurn}
                onDrawCard={() => { setCurrentCard(null); setCardRevealed(false); setShowLuckModal(true); }}
                onShowLoan={() => setShowLoanModal(true)}
                onShowNegotiation={() => setShowNegotiationModal(true)}
                handleTransaction={handleTransaction}
                handleBoardEvent={handleBoardEvent}
                onRollDice={handleRollDice}
                diceCooldown={diceCooldown}
            />
        )}


        {/* --- ABA CIDADE (MAQUETE & SERVIÇOS) --- */}
        {activeTab === 'city' && (
            <CityTab 
                groupedProperties={groupedProperties}
                players={players}
                user={user}
                setShowPropertyDetails={setShowPropertyDetails}
            />
        )}

        {activeTab === 'properties' && (
            <PropertiesTab 
                players={players}
                user={user}
                forceBuyMode={forceBuyMode}
                stealPropMode={stealPropMode}
                handleTransaction={handleTransaction}
                setForceBuyMode={setForceBuyMode}
                setStealPropMode={setStealPropMode}
                setShowPropertyDetails={setShowPropertyDetails}
                hasMonopoly={hasMonopoly}
            />
        )}

        {activeTab === 'profit' && (
            <ProfitTab 
                players={players}
                user={user}
                getRent={getRent}
                roomData={roomData}
            />
        )}

        {activeTab === 'achievements' && (
            <AchievementsTab 
                players={players}
                user={user}
                handleTransaction={handleTransaction}
            />
        )}

        {activeTab === 'history' && (
            <HistoryTab 
                transactions={transactions}
                setSelectedReceipt={setSelectedReceipt}
            />
        )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-6 left-6 right-6 h-16 bg-[#1a1b23]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full flex items-center justify-around z-50 px-2 ring-1 ring-white/5">
        {[{id:'actions',l:'Início',i:LayoutDashboard},{id:'city',l:'Cidade',i:MapPinned},{id:'properties',l:'Imóveis',i:Building2},{id:'profit',l:'Lucro',i:TrendingUp},{id:'achievements',l:'Metas',i:Trophy},{id:'history',l:'Registros',i:ScrollText}].map(t=>(
          <button key={t.id} onClick={()=>{ if(activeTab !== t.id) { setActiveTab(t.id); doFeedback(); } }} className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${activeTab===t.id ? '-translate-y-6 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${activeTab===t.id ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/40 rotate-180' : 'bg-transparent'}`}></div>
            <div className={`relative z-10 flex flex-col items-center justify-center ${activeTab===t.id ? 'text-white' : ''}`}>
                <t.i size={20} strokeWidth={2.5}/>
            </div>
            {activeTab===t.id && <span className="absolute -bottom-6 text-[10px] font-bold text-white tracking-wide animate-in fade-in slide-in-from-top-2 bg-[#1a1b23] px-2 py-0.5 rounded-full border border-white/10">{t.l}</span>}
          </button>
        ))}
      </div>

      <AnimatePresence>
      {showRankingModal && (<CompactModal title="Ranking de Fortunas" onClose={()=>setShowRankingModal(false)}><div className="space-y-3 pb-safe animate-in fade-in">{Object.values(players).sort((a,b) => (b.balance + b.assets) - (a.balance + a.assets)).map((p, i) => (<div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${p.id === user.uid ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100'}`}><div className="flex flex-col gap-0.5"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-400">#{i+1}</span><div className="relative flex items-center gap-2"><UserAvatar name={p.name} avatar={p.avatar} size={28} className="border-gray-200" /><span className="font-bold text-sm text-gray-800">{p.name}</span>{p.online && <span className="absolute top-0 left-5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" title="Online"></span>}</div></div><div className="flex gap-2 text-[9px] text-gray-500 font-mono"><span className="flex items-center gap-1"><Home size={10}/> {p.properties?.length || 0}</span><span className="flex items-center gap-1"><Building size={10}/> {Object.values(p.houses || {}).reduce((a,b)=>a+b,0)}</span></div></div><div className="text-right"><p className="font-black text-sm text-emerald-600">{formatCurrency(p.balance)}</p><p className="text-[9px] text-red-400">Dívida: {formatCurrency(p.debt)}</p></div></div>))}</div></CompactModal>)}
      </AnimatePresence>
      {showSettingsModal && (<CompactModal title="Configurações" onClose={()=>setShowSettingsModal(false)}><div className="space-y-4"><div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100"><p className="text-xs text-gray-500 uppercase mb-1">Código da Sala</p><p className="text-2xl font-mono font-bold text-gray-800 tracking-widest">{activeRoomId}</p></div><hr className="border-gray-100"/>{supportsFullScreen && <button onClick={toggleFullScreen} className="w-full bg-indigo-50 text-indigo-600 border border-indigo-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-indigo-100 transition"><Maximize size={18}/> Alternar Tela Cheia</button>}<button onClick={()=>handleTransaction('vote_restart')} disabled={isProcessing} className="w-full bg-orange-50 text-orange-600 border border-orange-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-orange-100 transition"><Vote size={18}/> {roomData.restartVotes?.includes(user.uid) ? 'Aguardando Outros...' : `Votar para Reiniciar (${roomData.restartVotes?.length || 0}/${Object.keys(players).length})`}</button><button onClick={()=>{setActiveRoomId(''); localStorage.removeItem('imoney_room_id'); /* setPlayerNameInput(''); */}} className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2"><LogOut size={18}/> Sair da Sala</button><button onClick={handleResetRoom} className="w-full bg-red-50 text-red-600 border border-red-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-red-100 transition"><Trash2 size={18}/> Apagar Sala (Reset Geral)</button>{roomData.gameStarted && !isBankrupt && (<><button onClick={()=>{ if(window.confirm("Tem certeza que deseja desistir? Seus bens voltarão ao banco.")) handleTransaction('quit_game'); }} className="w-full bg-orange-50 text-orange-600 border border-orange-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-orange-100 transition"><Flag size={18}/> Desistir do Jogo</button><button onClick={()=>{ if(window.confirm("Tem certeza que deseja declarar falência? Você perderá tudo.")) handleTransaction('bankrupt'); }} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition shadow-md"><Skull size={18}/> Declarar Falência</button></>)}<div className="pt-4 flex justify-center"><button onClick={()=>{setShowSettingsModal(false); setShowAdminModal(true);}} className="text-gray-300 opacity-20 hover:opacity-100 transition-opacity p-2"><ShieldAlert size={14}/></button></div></div></CompactModal>)}
      {showChatModal && (
        <CompactModal title="Chat da Sala" onClose={() => setShowChatModal(false)}>
          <div className="flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto space-y-3 p-2 mb-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col-reverse">
              {(roomData.chat || []).length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-10">Nenhuma mensagem ainda.</p>
              ) : (
                (roomData.chat || []).map((msg) => {
                   const isMe = msg.senderId === user.uid;
                   return (
                     <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                       <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${isMe ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'}`}>
                         {!isMe && <div className="flex items-center gap-1 mb-1"><UserAvatar name={msg.senderName} avatar={players[msg.senderId]?.avatar} size={16} className="border-gray-200" /><p className="text-[9px] font-bold opacity-70">{msg.senderName}</p></div>}
                         <p>{msg.content}</p>
                       </div>
                       <span className="text-[8px] text-gray-400 mt-1 mx-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                     </div>
                   );
                })
              )}
            </div>
            <div className="mb-4">
               <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Rápido</p>
               <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {QUICK_CHATS.map((msg, i) => (
                    <button key={i} onClick={() => handleSendChat(msg)} className="shrink-0 px-3 py-2 bg-gray-100 hover:bg-blue-50 rounded-lg text-sm border border-gray-200 transition active:scale-95 whitespace-nowrap">
                      {msg}
                    </button>
                  ))}
               </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if(chatInput.trim()) { handleSendChat(chatInput); setChatInput(''); } }} className="flex gap-2">
              <input value={chatInput} onChange={handleChatInputChange} placeholder="Digite sua mensagem..." className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition" />
              <button type="submit" disabled={!chatInput.trim()} className="bg-blue-600 text-white p-2 rounded-xl disabled:opacity-50 active:scale-95 transition"><Send size={18} /></button>
            </form>
            {Object.keys(typingUsers).length > 0 && (
                <p className="text-[10px] text-gray-400 animate-pulse ml-2 mt-1 font-bold">
                    {Object.keys(typingUsers).map(uid => players[uid]?.name).filter(Boolean).join(', ')} está digitando...
                </p>
            )}
          </div>
        </CompactModal>
      )}
      
      {/* MODAL DE SCORE DE CRÉDITO */}
      {showScoreModal && (
        <CompactModal title="Análise de Crédito" onClose={() => setShowScoreModal(false)}>
            <div className="space-y-4">
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Score Atual</p>
                        <p className={`text-4xl font-black ${getScoreColor(myScore)}`}>{myScore}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold">Taxa de Juros</p>
                        <p className="text-2xl font-bold text-gray-800">{(getInterestRate(myScore) * 100).toFixed(0)}% <span className="text-xs font-normal text-gray-400">a.r.</span></p>
                    </div>
                </div>

                {/* GRÁFICO SVG SIMPLES */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Histórico (Últimas 20 Rodadas)</p>
                    <div className="h-24 w-full flex items-end gap-1">
                        {(myPlayer.scoreHistory || [500]).map((val, i, arr) => {
                            const height = Math.max(5, (val / 1000) * 100);
                            return (
                                <div key={i} className="flex-1 bg-indigo-100 rounded-t-sm relative group">
                                    <div style={{ height: `${height}%` }} className={`w-full rounded-t-sm ${i === arr.length - 1 ? 'bg-indigo-500' : 'bg-indigo-300'}`}></div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                        <span>Antigo</span>
                        <span>Atual</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-800">Como melhorar seu Score?</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-emerald-50 text-emerald-700 p-2 rounded border border-emerald-100 flex items-center gap-1"><TrendingUp size={12}/> Pagar empréstimos (+25)</div>
                        <div className="bg-emerald-50 text-emerald-700 p-2 rounded border border-emerald-100 flex items-center gap-1"><CheckCircle2 size={12}/> Pagar contas em dia (+15)</div>
                        <div className="bg-red-50 text-red-700 p-2 rounded border border-red-100 flex items-center gap-1"><TrendingDown size={12}/> Ir para a cadeia (-100)</div>
                        <div className="bg-red-50 text-red-700 p-2 rounded border border-red-100 flex items-center gap-1"><AlertTriangle size={12}/> Vender ao banco (-30)</div>
                    </div>
                </div>
            </div>
        </CompactModal>
      )}



      {selectedReceipt && (
        <CompactModal title="Comprovante de Transação" onClose={() => setSelectedReceipt(null)}>
            <div className="bg-[#fffdf5]/90 backdrop-blur-xl p-6 rounded-xl border border-yellow-100 shadow-sm relative overflow-hidden animate-in zoom-in-95">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-200 to-yellow-100 opacity-50"></div>
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-3"><CheckCircle2 size={24} /></div>
                    <h2 className="text-lg font-black text-gray-800 uppercase tracking-wider">Comprovante</h2>
                    <p className="text-[10px] font-mono text-gray-400 mt-1">{new Date(selectedReceipt.timestamp).toLocaleString()}</p>
                </div>
                <div className="space-y-4">
                    <div className="text-center p-4 bg-yellow-50/50 rounded-xl border border-yellow-100/50">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Valor da Transação</p>
                        <p className="text-3xl font-black text-gray-800 font-mono">{formatCurrency(selectedReceipt.amount)}</p>
                    </div>
                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between border-b border-dashed border-gray-200 pb-2"><span className="text-gray-400">Tipo</span><span className="font-bold text-gray-700 text-right max-w-[150px]">{selectedReceipt.description}</span></div>
                        <div className="flex justify-between border-b border-dashed border-gray-200 pb-2"><span className="text-gray-400">Origem</span><span className="font-bold text-gray-700">{selectedReceipt.senderName || 'Sistema'}</span></div>
                        <div className="flex justify-between border-b border-dashed border-gray-200 pb-2"><span className="text-gray-400">Destino</span><span className="font-bold text-gray-700">{selectedReceipt.receiverName || 'Sistema'}</span></div>
                    </div>
                    <div className="pt-4">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-1">Autenticação (Hash)</p>
                        <div className="bg-gray-100 p-2 rounded text-[9px] font-mono text-gray-500 break-all tracking-tighter">{btoa(selectedReceipt.id + selectedReceipt.timestamp).substring(0, 24).toUpperCase()}</div>
                    </div>
                </div>
                <div className="mt-6 flex gap-2"><button onClick={() => setSelectedReceipt(null)} className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition">FECHAR</button></div>
            </div>
        </CompactModal>
      )}
      {showOfferModal && selectedProperty && (<CompactModal title="Mercado Negro" onClose={()=>setShowOfferModal(false)}><div className="space-y-4 text-center"><div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl"><p className="text-xs text-yellow-600 uppercase font-bold mb-1">Propriedade Alvo</p><p className="text-xl font-black text-gray-800">{selectedProperty.name}</p><p className="text-[10px] text-gray-500">Dono Atual: {players[selectedProperty.ownerId]?.name}</p></div><div><p className="text-xs text-gray-400 font-bold uppercase mb-2">Sua Oferta</p><input type="text" autoFocus value={modalAmountStr} onChange={e=>setModalAmountStr(formatInputCurrency(e.target.value))} placeholder="0" className="w-full p-3 bg-white border-2 border-indigo-100 rounded-xl text-center text-2xl font-bold text-indigo-600 outline-none focus:border-indigo-500 transition"/></div><button disabled={!parseInputCurrency(modalAmountStr) || isProcessing} onClick={()=>{handleTransaction('make_offer', parseInputCurrency(modalAmountStr), selectedProperty.ownerId, selectedProperty.name, selectedProperty.id); setShowOfferModal(false);}} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 disabled:opacity-50">ENVIAR PROPOSTA</button></div></CompactModal>)}
      {showLoanModal && (<CompactModal title="Gestão Financeira" onClose={()=>setShowLoanModal(false)}>
          <div className="space-y-4 text-center">
              <div className="bg-gray-50 p-3 rounded-xl mb-2">
                  <div className="flex justify-between items-center"><span className="text-xs text-gray-500">Taxa de Juros (Score {myScore}):</span><span className={`font-bold ${getScoreColor(myScore)}`}>{(getInterestRate(myScore) * 100).toFixed(0)}% a.r.</span></div>
                  <div className="flex justify-between items-center mt-2 border-t pt-2"><span className="text-xs text-gray-500">Limite (80% Bens):</span><span className="font-bold text-emerald-600 font-mono">{formatCurrency(loanLimit)}</span></div>
                  <div className="flex justify-between items-center mt-2 border-t pt-2"><span className="text-xs text-gray-500">Crédito Disponível:</span><span className="font-bold text-emerald-600 font-mono">{formatCurrency(availableCredit)}</span></div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Novo Empréstimo Bancário</p>
                  <div className="bg-gray-50 p-3 rounded-xl mb-2">
                      <input type="text" value={modalAmountStr} onChange={e=>setModalAmountStr(formatInputCurrency(e.target.value))} placeholder="Valor desejado" className="w-full p-2 bg-white border rounded-lg text-center font-bold text-lg"/>
                      <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Parcelas (Mensal):</span><span className="font-bold text-indigo-600">{loanInstallments}x</span></div>
                          <input type="range" min="1" max="6" value={loanInstallments} onChange={(e)=>setLoanInstallments(parseInt(e.target.value))} className="w-full accent-indigo-600"/>
                      </div>
                      {(() => {
                          const val = parseInputCurrency(modalAmountStr) || 0;
                          const i = getInterestRate(myScore);
                          const n = loanInstallments;
                          const pmt = val > 0 ? (val * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)) : 0;
                          const total = pmt * n;
                          return (
                              <div className="mt-3 bg-white p-2 rounded border border-gray-200 text-xs space-y-1">
                                  <div className="flex justify-between"><span className="text-gray-500">Parcela (cada 10 rodadas):</span><span className="font-bold text-red-500 font-mono">{formatCurrency(pmt)}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">Total a Pagar:</span><span className="font-bold text-gray-800 font-mono">{formatCurrency(total)}</span></div>
                              </div>
                          );
                      })()}
                      <button onClick={() => setModalAmountStr(formatInputCurrency(Math.floor(availableCredit).toString()))} className="text-[10px] text-indigo-500 font-bold underline mt-2 w-full text-right hover:text-indigo-700">PEGAR MÁXIMO ({formatCurrency(availableCredit)})</button>
                  </div>
                  {(() => {
                      const val = parseInputCurrency(modalAmountStr) || 0;
                      const i = getInterestRate(myScore);
                      const n = loanInstallments;
                      const pmt = val > 0 ? (val * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)) : 0;
                      const total = pmt * n;
                      const isOverLimit = (myDebt + val) > loanLimit;
                      
                      return isOverLimit ? (
                          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold text-center">CRÉDITO NEGADO (Limite Excedido)</div>
                      ) : (
                          <button disabled={!val} onClick={()=>handleTransaction('loan_take', val, null, loanInstallments.toString())} className="w-full bg-[#1a1b23] text-white py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition">PEGAR DINHEIRO</button>
                      );
                  })()}
              </div>
              {myDebt > 0 && (<div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold text-orange-500 uppercase mb-2">Antecipar Dívida Banco: {formatCurrency(myDebt)}</p>
                  <div className="bg-emerald-50 p-2 rounded mb-2 text-[10px] text-emerald-700 flex justify-between items-center">
                      <span>Pagar tudo agora tem desconto!</span>
                      <span className="font-bold">-{formatCurrency(Math.floor(myDebt * getInterestRate(myScore)))}</span>
                  </div>
                  <div className="flex gap-2"><input type="text" value={modalAmountStr} onChange={e=>setModalAmountStr(formatInputCurrency(e.target.value))} placeholder="Valor parcial" className="flex-1 p-2 border rounded-lg text-base"/><button disabled={!parseInputCurrency(modalAmountStr)} onClick={()=>handlePayLoan(parseInputCurrency(modalAmountStr))} className="bg-orange-500 text-white px-4 rounded-lg font-bold text-xs">PAGAR</button></div>
                  <button onClick={() => setModalAmountStr(formatInputCurrency(myDebt.toString()))} className="text-[10px] text-orange-500 font-bold underline mt-2 w-full text-right hover:text-orange-700">PREENCHER TOTAL</button>
              </div>)}
              {(myPlayer.privateDebts || []).length > 0 && (<div className="mt-4 border-t border-gray-100 pt-4"><p className="text-xs font-bold text-red-500 uppercase mb-2">Dívidas com Jogadores</p><div className="space-y-2 max-h-40 overflow-y-auto">{myPlayer.privateDebts.map(d => (<div key={d.id} className="bg-red-50 p-2 rounded-lg flex justify-between items-center border border-red-100"><div className="text-left"><p className="text-[10px] font-bold text-red-800">{players[d.creditorId]?.name || 'Desconhecido'}</p><p className="text-xs font-black text-red-600">{formatCurrency(d.amount)}</p></div><button onClick={()=>handleTransaction('pay_private_debt', d.amount, d.creditorId, d.id)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm active:scale-95">PAGAR</button></div>))}</div></div>)}
          </div>
      </CompactModal>)}
      {showPropertyDetails && (<CompactModal title="Escritura" onClose={()=>setShowPropertyDetails(null)}>{(() => { const prop = PROPERTIES_DB.find(p => p.id === showPropertyDetails); const ownerId = Object.keys(players).find(uid => players[uid].properties?.includes(prop.id)); const isMine = ownerId === user.uid; const isOwned = !!ownerId; const houses = (players[ownerId]?.houses || {})[prop.id] || 0; const rentValue = getRent(prop); const displayRentValue = getRent(prop, roomData); const groupMonopoly = hasMonopoly(prop.group); const isCompany = prop.group === 'company' || prop.group === 'special'; const isMortgaged = (players[ownerId]?.mortgaged || []).includes(prop.id); const groupProps = PROPERTIES_DB.filter(p => p.group === prop.group); const ownerHouses = players[ownerId]?.houses || {}; const minHouses = Math.min(...groupProps.map(p => ownerHouses[p.id] || 0)); const maxHouses = Math.max(...groupProps.map(p => ownerHouses[p.id] || 0)); const canBuild = houses === minHouses; const canSell = houses === maxHouses; return (<div className="space-y-4"><div className={`p-4 rounded-2xl text-white text-center ${COLORS[prop.group] || 'bg-gray-500'} relative overflow-hidden`}>{isMortgaged && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="bg-red-600 text-white px-4 py-1 rounded-full font-black uppercase tracking-widest rotate-[-15deg] border-2 border-white shadow-xl">HIPOTECADO</div></div>}<h2 className="text-xl font-bold">{prop.name}</h2><p className="text-3xl font-black mt-2 font-mono">{isCompany ? 'Dados x 50k' : formatCurrency(displayRentValue)}</p><p className="text-[10px] opacity-75">Aluguel Atual</p></div><div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1 text-gray-600">{isCompany ? <div>Lucro: Dados x {formatCurrency(prop.multiplier)}</div> : (<><div className="flex justify-between"><span>Base:</span><span>{formatCurrency(prop.rent)}</span></div><div className="flex justify-between"><span>1 Casa:</span><span>{formatCurrency(prop.rent1)}</span></div><div className="flex justify-between"><span>2 Casas:</span><span>{formatCurrency(prop.rent2)}</span></div><div className="flex justify-between"><span>3 Casas:</span><span>{formatCurrency(prop.rent3)}</span></div><div className="flex justify-between"><span>4 Casas:</span><span>{formatCurrency(prop.rent4)}</span></div><div className="flex justify-between font-bold text-indigo-600"><span>Hotel:</span><span>{formatCurrency(prop.rentHotel)}</span></div><div className="border-t border-gray-200 mt-2 pt-1 flex justify-between"><span>Custo Casa:</span><span>{formatCurrency(prop.houseCost)}</span></div></>)}</div>{isMine && (<div className="space-y-2"><div className="grid grid-cols-2 gap-2">{!isCompany && (groupMonopoly ? (<><button disabled={houses >= 5 || isJailed || (roomData.gameStarted && !isMyTurn) || isMortgaged || !canBuild} onClick={()=>handleTransaction('build', prop.houseCost, null, `Construção ${prop.name}`, prop.id)} className="bg-indigo-600 text-white p-3 rounded-xl font-bold text-sm shadow flex items-center justify-center gap-2 disabled:opacity-50"><Hammer size={16}/> CONSTRUIR</button>{houses > 0 && (<button disabled={roomData.gameStarted && !isMyTurn || !canSell} onClick={()=>handleTransaction('sell_house', 0, null, `Venda Casa ${prop.name}`, prop.id)} className="bg-orange-500 text-white p-3 rounded-xl font-bold text-xs shadow flex items-center justify-center gap-2 disabled:opacity-50">VENDER CASA (-50%)</button>)}</>) : (<button disabled className="col-span-2 bg-gray-300 text-gray-500 p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed"><Unlock size={14}/> COMPLETE O GRUPO</button>))}<button disabled={isJailed || (roomData.gameStarted && !isMyTurn) || isMortgaged} onClick={()=>handleTransaction('sell_bank', (prop.price + (houses * (prop.houseCost||0))) * SELL_BANK_RATE, null, `Venda Banco ${prop.name}`, prop.id)} className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-[9px] font-bold disabled:opacity-50">VENDER BANCO (50%)</button><button disabled={isJailed} onClick={()=>{setModalAmountStr(''); setTradePlayerId(null); setTradeTargetProp(null); setTradeTarget({propId: prop.id, propName: prop.name}); setShowTradeModal(true);}} className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-xl text-[9px] font-bold disabled:opacity-50">VENDER JOGADOR</button><button disabled={isJailed} onClick={()=>{ const startPrice = prompt("Preço inicial do leilão:", prop.price); if (startPrice) handleTransaction('start_auction', parseInputCurrency(startPrice), null, prop.name, prop.id); setShowPropertyDetails(null); }} className="col-span-2 bg-indigo-800 text-white py-2 rounded-xl text-[9px] font-bold disabled:opacity-50 flex items-center justify-center gap-2"><Gavel size={12}/> INICIAR LEILÃO</button>{isMortgaged ? (<button disabled={isJailed || (roomData.gameStarted && !isMyTurn)} onClick={()=>handleTransaction('unmortgage_prop', 0, null, null, prop.id)} className="col-span-2 bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs shadow flex items-center justify-center gap-2 disabled:opacity-50"><Lock size={14}/> RESGATAR HIPOTECA ({formatCurrency(prop.price * 0.6)})</button>) : (<button disabled={isJailed || (roomData.gameStarted && !isMyTurn) || houses > 0} onClick={()=>handleTransaction('mortgage_prop', 0, null, null, prop.id)} className="col-span-2 bg-gray-800 text-white py-3 rounded-xl font-bold text-xs shadow flex items-center justify-center gap-2 disabled:opacity-50"><Lock size={14}/> HIPOTECAR ({formatCurrency(prop.price * 0.5)})</button>)}</div><hr className="border-gray-200"/><p className="text-xs font-bold text-gray-400 uppercase text-center">Cobrar Aluguel de:</p><div className="grid grid-cols-2 gap-2">{Object.values(players).filter(p => p.id !== user.uid).map(p => (isCompany ? (<button key={p.id} disabled={isJailed || isMortgaged} onClick={()=>{setSelectedProperty({...prop, ownerId}); setChargeTarget(p.id); setShowDiceModal(true); setShowPropertyDetails(null);}} className="bg-emerald-100 text-emerald-700 p-2 rounded font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-50"><Dices size={14}/> {p.name}</button>) : (<button key={p.id} disabled={isJailed || isMortgaged} onClick={()=>handleTransaction('charge_rent', rentValue, p.id, `Aluguel ${prop.name}`, prop.id)} className="bg-emerald-100 text-emerald-700 p-2 rounded font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-50"><HandCoins size={14}/> {p.name}</button>)))}</div></div>)}{!isMine && ownerId && (isCompany ? (<button disabled={isJailed || isMortgaged} onClick={()=>{setSelectedProperty({...prop, ownerId}); setChargeTarget(null); setShowDiceModal(true); setShowPropertyDetails(null);}} className="w-full bg-red-500 text-white p-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 animate-pulse disabled:opacity-50"><Dices size={18}/> {isMortgaged ? 'HIPOTECADO (ISENTO)' : 'PAGAR ALUGUEL (DADOS)'}</button>) : (<button disabled={isJailed || isMortgaged} onClick={()=>handleTransaction('pay_rent', rentValue, ownerId, `Aluguel: ${prop.name}`, prop.id)} className="w-full bg-red-500 text-white p-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 animate-pulse disabled:opacity-50">{isMortgaged ? 'HIPOTECADO (ISENTO)' : `PAGAR ALUGUEL (${formatCurrency(displayRentValue)})`}</button>))}{!isOwned && (<div className="grid grid-cols-2 gap-2"><button disabled={isJailed || (roomData.gameStarted && !isMyTurn)} onClick={() => handleTransaction('buy_prop', prop.price, null, prop.id, prop.id)} className="bg-emerald-500 text-white px-3 py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 disabled:opacity-50">COMPRAR ({formatCurrency(prop.price)})</button>{isCompany ? (<button disabled={isJailed} onClick={()=>{setSelectedProperty({...prop, ownerId: 'BANK'}); setChargeTarget('BANK_FEE'); setShowDiceModal(true); setShowPropertyDetails(null);}} className="bg-red-100 text-red-600 px-3 py-3 rounded-xl font-bold text-xs border border-red-200 active:scale-95 disabled:opacity-50">TAXA (DADOS)</button>) : (<button disabled={isJailed || (roomData.gameStarted && !isMyTurn)} onClick={() => handleTransaction('pay_bank_rent', prop.rent, null, prop.name, prop.id)} className="bg-red-100 text-red-600 px-3 py-3 rounded-xl font-bold text-xs border border-red-200 active:scale-95 disabled:opacity-50">PAGAR TAXA ({formatCurrency(displayRentValue)})</button>)}</div>)}{isOwned && !isMine && (<button onClick={()=>{setSelectedProperty({...prop, ownerId}); setModalAmountStr(''); setShowOfferModal(true); setShowPropertyDetails(null);}} className="w-full mt-2 bg-yellow-500 text-white px-3 py-3 rounded-xl font-bold text-sm shadow-md active:scale-95">FAZER OFERTA (MERCADO NEGRO)</button>)}</div>);})()}</CompactModal>)}
      {showDiceModal && selectedProperty && (<CompactModal title={`Aluguel: ${selectedProperty.name}`} onClose={()=>setShowDiceModal(false)} allowClose={!diceResult}><div className="text-center py-6"><Dices size={48} className="mx-auto text-indigo-500 mb-4 animate-bounce"/><p className="text-sm text-gray-600 mb-4">Multiplicador: <strong className="font-mono">{formatCurrency(selectedProperty.multiplier)}</strong> x Sorteio (2-12)</p>{diceResult ? (<div className="bg-indigo-50 p-4 rounded-2xl mb-4"><p className="text-xs uppercase text-indigo-400 font-bold">Resultado</p><p className="text-4xl font-black text-indigo-700">{diceResult}</p><p className="text-sm text-gray-500 mt-2">Total: <span className="font-bold text-red-500 font-mono">{formatCurrency(diceResult * selectedProperty.multiplier)}</span></p></div>) : (<button onClick={rollDiceForRent} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg w-full mb-4">SORTEAR MULTIPLICADOR</button>)}{diceResult && (<button onClick={() => { const val = diceResult * selectedProperty.multiplier; if (chargeTarget === 'BANK_FEE') { handleTransaction('pay_bank_rent', val, null, `Taxa Cia: ${selectedProperty.name}`, selectedProperty.id); } else if (chargeTarget) { handleTransaction('charge_rent', val, chargeTarget, `Aluguel Cia: ${selectedProperty.name}`, selectedProperty.id); } else { handleTransaction('pay_rent', val, selectedProperty.ownerId, `Cia: ${selectedProperty.name}`, selectedProperty.id); } setDiceResult(null); setChargeTarget(null); }} className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg w-full">CONFIRMAR {chargeTarget ? 'COBRANÇA' : 'PAGAMENTO'}</button>)}</div></CompactModal>)}
      {showLuckModal && (<CompactModal title="Sorte ou Revés" onClose={()=>setShowLuckModal(false)} allowClose={!cardRevealed}><div className="flex flex-col items-center justify-center py-4 min-h-[300px]">{!cardRevealed ? (<div onClick={() => { drawCard(); }} className="w-48 h-64 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-2xl flex flex-col items-center justify-center cursor-pointer transform hover:scale-105 transition-all border-4 border-white/20"><Sparkles size={48} className="text-white mb-2 animate-pulse"/><span className="text-white font-bold text-lg tracking-widest">TIRAR</span><span className="text-white/50 text-xs font-bold tracking-widest uppercase mt-1">Carta</span></div>) : (currentCard && (<div className={`w-full max-w-xs animate-in zoom-in-90 duration-300 rounded-3xl p-6 text-center shadow-2xl border-4 ${currentCard.type === 'luck' ? 'bg-emerald-50 border-emerald-200' : (currentCard.type === 'item' ? 'bg-indigo-50 border-indigo-200' : 'bg-red-50 border-red-200')}`}>{currentCard.type === 'luck' ? <Sparkles size={40} className="mx-auto text-emerald-500 mb-2"/> : (currentCard.type === 'item' ? <Backpack size={40} className="mx-auto text-indigo-500 mb-2"/> : <AlertTriangle size={40} className="mx-auto text-red-500 mb-2"/>)}<h2 className={`text-2xl font-black mb-2 uppercase ${currentCard.type === 'luck' ? 'text-emerald-600' : (currentCard.type === 'item' ? 'text-indigo-600' : 'text-red-600')}`}>{currentCard.title}</h2><p className="text-gray-600 font-medium mb-4 min-h-[3rem]">{currentCard.text}</p>{currentCard.amount > 0 && <div className={`text-3xl font-bold mb-6 font-mono ${currentCard.type === 'luck' ? 'text-emerald-600' : 'text-red-600'}`}>{currentCard.action === 'pay_loan_percent' ? `${currentCard.amount * 100}%` : formatCurrency(currentCard.amount)}</div>}<button onClick={processCardEffect} disabled={isProcessing} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg active:scale-95 transition ${currentCard.type === 'luck' ? 'bg-emerald-500 hover:bg-emerald-600' : (currentCard.type === 'item' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-red-500 hover:bg-red-600')}`}>{isProcessing ? <Loader2 className="animate-spin mx-auto"/> : (currentCard.action === 'force_buy_mode' ? 'SELECIONAR IMÓVEL' : (currentCard.type === 'luck' ? 'RESGATAR' : (currentCard.type === 'item' ? 'GUARDAR' : 'PAGAR')))}</button></div>))}</div></CompactModal>)}
      {showInventoryModal && (<CompactModal title="Mochila de Itens" onClose={()=>setShowInventoryModal(false)}><div className="space-y-4">{myInventory.length === 0 ? (<div className="text-center text-gray-400 py-8"><Backpack size={48} className="mx-auto mb-2 opacity-50"/><p className="text-sm">Você não tem itens guardados.</p></div>) : (myInventory.map((itemId, i) => (<div key={i} className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center"><div><h4 className="font-bold text-indigo-800 text-sm uppercase">{ITEM_NAMES[itemId] || itemId}</h4><p className="text-xs text-indigo-500">Item Especial</p></div><button onClick={()=>useInventoryItem(itemId)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md active:scale-95">USAR</button></div>)))}</div></CompactModal>)}
      
      {isProcessing && (
        <LoadingScreen message="Processando..." />
      )}


    </div>
  );
}
