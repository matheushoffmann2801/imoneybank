import { safeNum } from './gameUtils.js';
import * as bankHandlers from './handlers/bankHandlers.js';
import * as propertyHandlers from './handlers/propertyHandlers.js';
import * as marketHandlers from './handlers/marketHandlers.js';
import * as adminHandlers from './handlers/adminHandlers.js';
import * as gameHandlers from './handlers/gameHandlers.js';

const handlers = {
    ...bankHandlers,
    ...propertyHandlers,
    ...marketHandlers,
    ...adminHandlers,
    ...gameHandlers
};

// Função Principal de Processamento
export const processAction = (room, { userId, type, amount, targetId, note, propId }) => {
    const isAdmin = userId === 'ADMIN';
    const player = room.players[userId];
    if (!player && !isAdmin) throw new Error("Jogador não encontrado");

    // Validação Global de Amount
    if (amount !== undefined && (isNaN(parseFloat(amount)) || parseFloat(amount) < 0)) {
        throw new Error("Valor inválido");
    }

    // Helpers de Estado
    const pSender = isAdmin ? { name: 'Banco Central', id: 'ADMIN' } : player;
    const pTarget = targetId && room.players[targetId] ? room.players[targetId] : null;
    let desc = '';
    let fromId = userId;
    let toId = targetId || 'BANK';
    let finalAmount = safeNum(amount);

    const handler = handlers[type];
    if (handler) {
        const result = handler(room, { userId, amount: finalAmount, finalAmount, targetId, note, propId, pSender, pTarget });
        if (result) {
            if (result.desc) desc = result.desc;
            if (result.fromId) fromId = result.fromId;
            if (result.toId) toId = result.toId;
            if (result.amount !== undefined) finalAmount = result.amount;
        }
    } else {
        throw new Error("Ação desconhecida: " + type);
    }

    // --- REGISTRO DE HISTÓRICO ---
    // Melhoria: Usa pTarget.name se disponível para garantir nome correto mesmo após expulsão (kick)
    const resolveName = (id) => {
        if (id === 'BANK') return 'Banco';
        if (id === 'ADMIN') return 'Banco Central';
        if (id === targetId && pTarget) return pTarget.name; // Fallback para alvo (útil se foi deletado)
        return room.players[id]?.name || 'Desconhecido';
    };

    const senderName = resolveName(fromId);
    const receiverName = resolveName(toId);

    const newTx = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        type,
        amount: finalAmount, // Pode ser 0
        note: String(note || ''),
        description: desc,
        from: fromId,
        to: toId,
        senderName: senderName,
        receiverName: receiverName
    };

    room.transactions = [newTx, ...(room.transactions || []).slice(0, 49)];

    // --- AUDIT LOG (ADMIN ONLY) ---
    if (isAdmin) {
        if (!room.adminLogs) room.adminLogs = [];
        room.adminLogs = [{
            id: Date.now().toString() + '_audit',
            timestamp: Date.now(),
            action: type,
            description: desc,
            target: pTarget ? pTarget.name : 'Sistema',
            amount: finalAmount
        }, ...room.adminLogs].slice(0, 50);
    }
};
