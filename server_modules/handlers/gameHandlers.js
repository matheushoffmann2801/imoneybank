import { safeNum, formatCurrency } from '../gameUtils.js';
import { BANK_START_RESERVE, INITIAL_BALANCE, JAIL_BAIL, ITEM_NAMES } from '../gameData.js';
import { performPassTurn, processMandatoryPayment } from '../logicHelpers.js';

export const start_game = (room) => {
    const playerIds = Object.keys(room.players);
    if (playerIds.length < 2) throw new Error("Precisa de 2 jogadores!");
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    room.gameStarted = true;
    room.turnOrder = shuffled;
    room.currentPlayerId = shuffled[0];
    return { desc: `Jogo Iniciado! Começa: ${room.players[shuffled[0]].name}`, fromId: 'BANK' };
};

export const vote_restart = (room, { userId }) => {
    const votes = room.restartVotes || [];
    if (votes.includes(userId)) throw new Error("Já votou!");
    room.restartVotes = [...votes, userId];
    const totalPlayers = Object.keys(room.players).length;
    if (room.restartVotes.length > (totalPlayers / 2)) {
        room.gameStarted = false; room.winner = null; room.restartVotes = []; room.currentPlayerId = null; room.transactions = []; room.offers = []; room.bankReserve = BANK_START_RESERVE;
        Object.values(room.players).forEach(p => { p.balance = INITIAL_BALANCE; p.assets = 0; p.debt = 0; p.properties = []; p.houses = {}; p.isJailed = false; p.inventory = []; p.creditScore = 500; });
        return { desc: 'Jogo Reiniciado (Votação)' };
    }
    return { desc: `Votou para Reiniciar (${room.restartVotes.length}/${totalPlayers})` };
};

export const quit_game = (room, { userId, pSender }) => {
    room.bankReserve = (room.bankReserve || BANK_START_RESERVE) + safeNum(pSender.balance);
    pSender.balance = 0; pSender.assets = 0; pSender.debt = 0; pSender.properties = []; pSender.inventory = []; pSender.houses = {}; pSender.isJailed = false;
    if (room.currentPlayerId === userId) performPassTurn(room);
    const activePlayers = Object.values(room.players).filter(p => p.id !== userId && (safeNum(p.balance) + safeNum(p.assets)) > 0);
    if (activePlayers.length === 1) room.winner = activePlayers[0].id;
    return { desc: 'Desistiu do Jogo' };
};

export const bankrupt = (room, { userId, pSender }) => {
    // Reutiliza lógica de quit_game mas com descrição diferente
    const res = quit_game(room, { userId, pSender });
    return { ...res, desc: 'Falência Declarada' };
};

export const pass_turn = (room) => {
    const skipNote = performPassTurn(room);
    return { desc: 'Passou a Vez' + (skipNote || ''), amount: 0 };
};

export const freeze_player = (room, { pSender }) => {
    pSender.frozenTurns = 2;
    const skipNote = performPassTurn(room);
    return { desc: 'Burnout: 2 rodadas sem jogar' + (skipNote || ''), amount: 0 };
};

export const go_to_jail = (room, { userId, pSender }) => {
    pSender.isJailed = true; pSender.jailTurns = 3; pSender.jailCount = (pSender.jailCount || 0) + 1;
    pSender.creditScore = Math.max(0, (pSender.creditScore || 500) - 100);
    const currentDebt = safeNum(pSender.debt);
    let penaltyLog = '';
    if (currentDebt > 0) {
        const isRecidivist = pSender.jailCount > 1;
        const penaltyFactor = isRecidivist ? 1.0 : 0.5;
        const penaltyAmount = Math.floor(currentDebt * penaltyFactor);
        const payResult = processMandatoryPayment(room, penaltyAmount, userId);
        if (!payResult.success) throw new Error("FALÊNCIA: Bens insuficientes para pagar a pena.");
        pSender.debt = Math.max(0, currentDebt - penaltyAmount);
        if (pSender.activeLoans) {
            pSender.activeLoans.forEach(l => { l.totalDue = Math.floor(l.totalDue * (1 - penaltyFactor)); l.installmentValue = Math.floor(l.installmentValue * (1 - penaltyFactor)); });
            if (isRecidivist) pSender.activeLoans = [];
        }
        penaltyLog = ` (Pagou ${isRecidivist ? '100%' : '50%'} da dívida${payResult.log})`;
    }
    const skipNote = performPassTurn(room);
    return { desc: `Foi para a Cadeia${penaltyLog}` + (skipNote || ''), amount: 0 };
};

export const pay_bail = (room, { userId, pSender }) => {
    if (!pSender.isJailed) throw new Error("Você não está preso!");
    if (!processMandatoryPayment(room, JAIL_BAIL, userId).success) throw new Error("FALÊNCIA");
    pSender.isJailed = false; pSender.jailTurns = 0;
    room.bankReserve = (room.bankReserve || BANK_START_RESERVE) + JAIL_BAIL;
    return { desc: 'Pagou Fiança', amount: JAIL_BAIL };
};

export const use_habeas_corpus = (room, { pSender }) => {
    if (!pSender.isJailed) throw new Error("Você não está preso!");
    const idx = (pSender.inventory || []).indexOf('habeas_corpus');
    if (idx === -1) throw new Error("Item não encontrado");
    pSender.inventory.splice(idx, 1);
    pSender.isJailed = false; pSender.jailTurns = 0;
    return { desc: 'Usou Habeas Corpus', amount: 0 };
};

export const use_black_card = (room, { pSender }) => {
    const currentDebt = safeNum(pSender.debt);
    if (currentDebt <= 0) throw new Error("Sem dívidas!");
    const idx = (pSender.inventory || []).indexOf('black_card');
    if (idx === -1) throw new Error("Item não encontrado");
    pSender.inventory.splice(idx, 1);
    pSender.debt = 0;
    return { desc: `Usou Cartão Black (Quitou ${formatCurrency(currentDebt)})`, amount: 0 };
};

export const add_inventory = (room, { note, pSender }) => {
    pSender.inventory = [...(pSender.inventory || []), note];
    return { desc: `Item: ${ITEM_NAMES[note] || note}`, fromId: 'BANK' };
};

export const claim_achievement = (room, { finalAmount, propId, note, pSender }) => {
    if ((pSender.achievements || []).includes(propId)) throw new Error("Conquista já resgatada!");
    pSender.balance = safeNum(pSender.balance) + finalAmount;
    pSender.achievements = [...(pSender.achievements || []), propId];
    return { desc: `Conquista: ${note}`, fromId: 'BANK' };
};
