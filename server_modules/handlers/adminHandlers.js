import { safeNum, formatCurrency } from '../gameUtils.js';
import { PROPERTIES_DB, ITEM_NAMES } from '../gameData.js';
import { performPassTurn } from '../logicHelpers.js';

export const admin_add_money = (room, { targetId, finalAmount, pTarget }) => {
    if (!pTarget) throw new Error("Alvo necessário");
    pTarget.balance = safeNum(pTarget.balance) + finalAmount;
    return { desc: `BC: Crédito de ${formatCurrency(finalAmount)} para ${pTarget.name}`, fromId: 'BANK', toId: targetId };
};

export const admin_remove_money = (room, { targetId, finalAmount, pTarget }) => {
    if (!pTarget) throw new Error("Alvo necessário");
    pTarget.balance = safeNum(pTarget.balance) - finalAmount;
    return { desc: `BC: Débito de ${formatCurrency(finalAmount)} de ${pTarget.name}`, fromId: targetId, toId: 'BANK' };
};

export const admin_seize_prop = (room, { targetId, propId, pTarget }) => {
    if (!pTarget) throw new Error("Alvo necessário");
    const prop = PROPERTIES_DB.find(p => p.id === propId);
    if (!prop) throw new Error("Imóvel inválido");
    if (!(pTarget.properties || []).includes(propId)) throw new Error("Jogador não possui este imóvel");
    
    const isMortgaged = (pTarget.mortgaged || []).includes(propId);
    pTarget.properties = pTarget.properties.filter(id => id !== propId);
    if (pTarget.mortgaged) pTarget.mortgaged = pTarget.mortgaged.filter(id => id !== propId);
    let assetReduction = isMortgaged ? (prop.price * 0.5) : prop.price;
    if (pTarget.houses && pTarget.houses[propId]) {
        assetReduction += (pTarget.houses[propId] * prop.houseCost);
        delete pTarget.houses[propId];
    }
    pTarget.assets = Math.max(0, safeNum(pTarget.assets) - assetReduction);
    return { desc: `BC: Penhora de ${prop.name} (${pTarget.name})`, fromId: targetId, toId: 'BANK' };
};

export const admin_jail = (room, { targetId, pTarget }) => {
    if (!pTarget) throw new Error("Alvo necessário");
    pTarget.isJailed = true; pTarget.jailTurns = 3;
    return { desc: `BC: Prendeu ${pTarget.name}`, fromId: 'ADMIN', toId: targetId };
};

export const admin_unjail = (room, { targetId, pTarget }) => {
    if (!pTarget) throw new Error("Alvo necessário");
    pTarget.isJailed = false; pTarget.jailTurns = 0;
    return { desc: `BC: Soltou ${pTarget.name}`, fromId: 'ADMIN', toId: targetId };
};

export const admin_kick = (room, { targetId, pTarget }) => {
    if (!pTarget) throw new Error("Alvo necessário");
    delete room.players[targetId];
    if (room.turnOrder) room.turnOrder = room.turnOrder.filter(id => id !== targetId);
    if (room.currentPlayerId === targetId) performPassTurn(room);
    return { desc: `BC: Expulsou ${pTarget.name}`, fromId: 'ADMIN', toId: targetId };
};

export const admin_freeze = (room, { targetId, pTarget }) => {
    if (!pTarget) throw new Error("Alvo necessário");
    pTarget.frozenTurns = (pTarget.frozenTurns || 0) + 2;
    return { desc: `BC: Congelou ${pTarget.name}`, fromId: 'ADMIN', toId: targetId };
};

export const admin_add_item = (room, { targetId, note, pTarget }) => {
    if (!pTarget) throw new Error("Alvo necessário");
    pTarget.inventory = [...(pTarget.inventory || []), note];
    return { desc: `BC: Deu item ${ITEM_NAMES[note] || note} para ${pTarget.name}`, fromId: 'ADMIN', toId: targetId, amount: 0 };
};

export const global_earthquake = (room) => {
    let destroyedCount = 0;
    let victims = [];
    Object.values(room.players).forEach(p => {
        if (p.houses && Object.keys(p.houses).length > 0) {
            const propsWithHouses = Object.keys(p.houses).filter(pid => p.houses[pid] > 0);
            if (propsWithHouses.length > 0) {
                const randomPropId = propsWithHouses[Math.floor(Math.random() * propsWithHouses.length)];
                p.houses[randomPropId]--;
                if (p.houses[randomPropId] === 0) delete p.houses[randomPropId];
                const prop = PROPERTIES_DB.find(x => x.id === randomPropId);
                if (prop) p.assets = Math.max(0, safeNum(p.assets) - prop.houseCost);
                destroyedCount++;
                victims.push(p.name);
            }
        }
    });
    return { desc: destroyedCount > 0 ? `TERREMOTO! Casas destruídas de: ${victims.join(', ')}` : `TERREMOTO! Mas ninguém tinha casas.`, fromId: 'ADMIN', toId: 'BANK', amount: 0 };
};
