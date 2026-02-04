import { safeNum, formatCurrency } from '../gameUtils.js';
import { PROPERTIES_DB, SELL_BANK_RATE, BANK_START_RESERVE } from '../gameData.js';
import { processMandatoryPayment } from '../logicHelpers.js';

export const buy_prop = (room, { userId, finalAmount, propId, pSender }) => {
    const prop = PROPERTIES_DB.find(p => p.id === propId);
    if (!prop) throw new Error("Imóvel inválido");
    const isOwned = Object.values(room.players).some(p => (p.properties || []).includes(propId));
    if (isOwned) throw new Error("Imóvel já possui dono!");

    if (prop.group === 'company' || prop.group === 'special') {
        const myCompanies = (pSender.properties || []).filter(pid => {
            const p = PROPERTIES_DB.find(dbP => dbP.id === pid);
            return p && (p.group === 'company' || p.group === 'special');
        });
        if (myCompanies.length >= 3) throw new Error("Máximo de 3 empresas por jogador!");
    }

    let cost = prop.price;
    let desc = `Comprou: ${prop.name}`;
    if ((room.activeEvents || []).some(e => e.id === 'black_friday')) {
        cost = Math.floor(cost * 0.8);
        desc = `Comprou (Black Friday): ${prop.name}`;
    }

    if (safeNum(pSender.balance) < cost) throw new Error("Saldo insuficiente");
    pSender.balance -= cost;
    pSender.properties = [...(pSender.properties || []), propId];
    pSender.assets = safeNum(pSender.assets) + cost;
    room.bankReserve += cost;
    return { desc, amount: cost };
};

export const build = (room, { userId, propId, pSender }) => {
    const prop = PROPERTIES_DB.find(p => p.id === propId);
    if (!prop) throw new Error("Imóvel inválido");
    const cost = prop.houseCost;
    const houses = pSender.houses || {};
    const currentCount = houses[propId] || 0;
    if (currentCount >= 5) throw new Error("Máximo de construções atingido");

    const groupProps = PROPERTIES_DB.filter(p => p.group === prop.group);
    const playerProps = pSender.properties || [];
    if (!groupProps.every(p => playerProps.includes(p.id))) throw new Error("Grupo incompleto!");
    if (groupProps.some(p => (pSender.mortgaged || []).includes(p.id))) throw new Error("Há imóveis hipotecados no grupo!");
    const minHouses = Math.min(...groupProps.map(p => houses[p.id] || 0));
    if (currentCount > minHouses) throw new Error("Construa uniformemente!");

    if (safeNum(pSender.balance) < cost) throw new Error("Saldo insuficiente");
    pSender.balance -= cost;
    pSender.assets = safeNum(pSender.assets) + cost;
    if (!pSender.houses) pSender.houses = {};
    pSender.houses[propId] = currentCount + 1;
    room.bankReserve += cost;
    return { desc: `Construção: ${prop.name} (+1 Cupom)`, amount: cost };
};

export const sell_house = (room, { userId, propId, pSender }) => {
    const prop = PROPERTIES_DB.find(p => p.id === propId);
    if (!prop) throw new Error("Imóvel inválido");
    const houses = pSender.houses || {};
    const currentCount = houses[propId] || 0;
    if (currentCount <= 0) throw new Error("Sem casas para vender");

    const groupProps = PROPERTIES_DB.filter(p => p.group === prop.group);
    const maxHouses = Math.max(...groupProps.map(p => houses[p.id] || 0));
    if (currentCount < maxHouses) throw new Error("Venda uniformemente!");

    const sellValue = (prop.houseCost * SELL_BANK_RATE);
    pSender.balance = safeNum(pSender.balance) + sellValue;
    pSender.assets = Math.max(0, safeNum(pSender.assets) - prop.houseCost);
    pSender.houses[propId] = currentCount - 1;
    pSender.creditScore = Math.max(0, (pSender.creditScore || 500) - 15);
    return { desc: `Vendeu Casa: ${prop.name}`, amount: sellValue };
};

export const sell_bank = (room, { userId, propId, pSender }) => {
    const prop = PROPERTIES_DB.find(p => p.id === propId);
    if (!prop) throw new Error("Imóvel inválido");
    if (!(pSender.properties || []).includes(propId)) throw new Error("Não possui este imóvel");
    if ((pSender.mortgaged || []).includes(propId)) throw new Error("Imóvel hipotecado!");

    const houses = (pSender.houses || {})[propId] || 0;
    const totalValue = prop.price + (houses * prop.houseCost);
    const sellValue = totalValue * SELL_BANK_RATE;
    
    pSender.balance = safeNum(pSender.balance) + sellValue;
    pSender.properties = pSender.properties.filter(id => id !== propId);
    pSender.assets = Math.max(0, safeNum(pSender.assets) - totalValue);
    if (pSender.houses) delete pSender.houses[propId];
    pSender.creditScore = Math.max(0, (pSender.creditScore || 500) - 30);
    return { desc: `Vendeu ao Banco: ${prop.name}`, amount: sellValue };
};

export const mortgage_prop = (room, { userId, propId, pSender }) => {
    const prop = PROPERTIES_DB.find(p => p.id === propId);
    if (!prop) throw new Error("Imóvel inválido");
    if (!(pSender.properties || []).includes(propId)) throw new Error("Não possui este imóvel");
    if ((pSender.houses || {})[propId] > 0) throw new Error("Venda as casas antes!");
    if ((pSender.mortgaged || []).includes(propId)) throw new Error("Já está hipotecado!");

    const val = Math.floor(prop.price * 0.5);
    pSender.balance = safeNum(pSender.balance) + val;
    pSender.assets = Math.max(0, safeNum(pSender.assets) - val);
    pSender.mortgaged = [...(pSender.mortgaged || []), propId];
    return { desc: `Hipotecou: ${prop.name}`, amount: val, fromId: 'BANK', toId: userId };
};

export const unmortgage_prop = (room, { userId, propId, pSender }) => {
    const prop = PROPERTIES_DB.find(p => p.id === propId);
    if (!prop) throw new Error("Imóvel inválido");
    if (!(pSender.mortgaged || []).includes(propId)) throw new Error("Não está hipotecado!");

    const cost = Math.floor(prop.price * 0.6);
    if (safeNum(pSender.balance) < cost) throw new Error("Saldo insuficiente!");

    pSender.balance -= cost;
    pSender.assets = safeNum(pSender.assets) + Math.floor(prop.price * 0.5);
    pSender.mortgaged = pSender.mortgaged.filter(id => id !== propId);
    room.bankReserve += cost;
    return { desc: `Resgatou Hipoteca: ${prop.name}`, amount: cost };
};

export const charge_rent = (room, { userId, targetId, finalAmount, note, pSender, pTarget }) => {
    if (!pTarget) throw new Error("Alvo inválido");
    let amount = finalAmount;
    let weatherEffect = '';
    if (room.weather === 'Sol') { amount = Math.floor(amount * 1.2); weatherEffect = ' (+20% Sol)'; }
    else if (room.weather === 'Chuva') { amount = Math.floor(amount * 0.8); weatherEffect = ' (-20% Chuva)'; }

    const payResult = processMandatoryPayment(room, amount, targetId);
    if (!payResult.success) throw new Error("Jogador alvo faliu!");
    pSender.balance = safeNum(pSender.balance) + amount;
    return { desc: `Aluguel: ${note}${weatherEffect}${payResult.log}`, amount, fromId: targetId, toId: userId };
};

export const pay_rent = (room, { userId, targetId, finalAmount, note, pTarget }) => {
    if (!pTarget) throw new Error("Alvo inválido");
    let amount = finalAmount;
    let weatherEffect = '';
    if (room.weather === 'Sol') { amount = Math.floor(amount * 1.2); weatherEffect = ' (+20% Sol)'; }
    else if (room.weather === 'Chuva') { amount = Math.floor(amount * 0.8); weatherEffect = ' (-20% Chuva)'; }

    const payResult = processMandatoryPayment(room, amount, userId);
    if (!payResult.success) throw new Error("FALÊNCIA");
    pTarget.balance = safeNum(pTarget.balance) + amount;
    return { desc: `Aluguel: ${note}${weatherEffect}${payResult.log}`, amount, toId: targetId };
};

export const pay_bank_rent = (room, { userId, finalAmount, note, propId }) => {
    let amount = finalAmount;
    let weatherEffect = '';
    if (propId) {
        if (room.weather === 'Sol') { amount = Math.floor(amount * 1.2); weatherEffect = ' (+20% Sol)'; }
        else if (room.weather === 'Chuva') { amount = Math.floor(amount * 0.8); weatherEffect = ' (-20% Chuva)'; }
    }
    const payResult = processMandatoryPayment(room, amount, userId);
    if (!payResult.success) throw new Error("FALÊNCIA");
    room.bankReserve = (room.bankReserve || BANK_START_RESERVE) + amount;
    return { desc: `Taxa Banco: ${note}${weatherEffect}${payResult.log}`, amount };
};

export const force_buy = (room, { userId, finalAmount, propId, note, pSender, pTarget }) => {
    const idx = (pSender.inventory || []).indexOf('free_buy');
    if (idx === -1) throw new Error("Você não tem o item Compra Livre!");
    const prop = PROPERTIES_DB.find(p => p.id === propId);
    if (!prop) throw new Error("Imóvel inválido");
    if (pTarget && (pTarget.mortgaged || []).includes(propId)) throw new Error("Imóvel hipotecado!");
    
    if (prop.group === 'company' || prop.group === 'special') {
        const myCompanies = (pSender.properties || []).filter(pid => {
            const p = PROPERTIES_DB.find(dbP => dbP.id === pid);
            return p && (p.group === 'company' || p.group === 'special');
        });
        if (myCompanies.length >= 3) throw new Error("Máximo de 3 empresas!");
    }

    if (pTarget) {
         const groupProps = PROPERTIES_DB.filter(p => p.group === prop.group);
         if (groupProps.some(p => (pTarget.houses || {})[p.id] > 0)) throw new Error("Grupo possui construções!");
    }

    const cost = prop.price;
    if (safeNum(pSender.balance) < cost) throw new Error("Saldo insuficiente!");
    
    pSender.inventory.splice(idx, 1);
    pSender.balance -= cost;
    
    if (pTarget) {
         pTarget.properties = (pTarget.properties || []).filter(id => id !== propId);
         pTarget.balance = safeNum(pTarget.balance) + cost;
         if (pTarget.houses && pTarget.houses[propId]) delete pTarget.houses[propId];
         pTarget.assets = Math.max(0, safeNum(pTarget.assets) - cost);
    } else {
         room.bankReserve += cost;
    }

    pSender.properties = [...(pSender.properties || []), propId];
    pSender.assets = safeNum(pSender.assets) + cost;
    return { desc: `Compra Livre: ${note}`, amount: cost };
};

export const steal_prop = (room, { userId, propId, note, pSender, pTarget }) => {
    const idx = (pSender.inventory || []).indexOf('steal_prop');
    if (idx === -1) throw new Error("Você não tem o item Usucapião!");
    if (pTarget && (pTarget.mortgaged || []).includes(propId)) throw new Error("Imóvel hipotecado!");

    if (pTarget) {
        const prop = PROPERTIES_DB.find(p => p.id === propId);
        if (prop) {
            const groupProps = PROPERTIES_DB.filter(p => p.group === prop.group);
            if (groupProps.some(p => (pTarget.houses || {})[p.id] > 0)) throw new Error("Grupo possui construções!");
        }
        pTarget.properties = (pTarget.properties || []).filter(id => id !== propId);
        const propVal = prop?.price || 0;
        pTarget.assets = Math.max(0, safeNum(pTarget.assets) - propVal);
        if (pTarget.houses && pTarget.houses[propId]) delete pTarget.houses[propId];
        pSender.properties = [...(pSender.properties || []), propId];
        pSender.assets = safeNum(pSender.assets) + propVal;
    }
    pSender.inventory.splice(idx, 1);
    return { desc: `Roubou Imóvel: ${note}`, amount: 0 };
};
