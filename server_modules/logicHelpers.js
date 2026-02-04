import { safeNum, formatCurrency, getInterestRate } from './gameUtils.js';
import { 
    PROPERTIES_DB, SELL_BANK_RATE, LOAN_LIMIT_PERCENT, 
    BANK_START_RESERVE, JAIL_BAIL 
} from './gameData.js';

export const processMandatoryPayment = (room, cost, payerId) => {
    const payer = room.players[payerId];
    let balance = safeNum(payer.balance);
    let notes = [];

    // 1. Tenta pagar com saldo
    if (balance >= cost) { 
         payer.balance = balance - cost;
         return { success: true, log: '' };
    }

    // 2. Vender Casas
    if (payer.houses) {
        for (const [propId, count] of Object.entries(payer.houses)) {
            if (balance >= cost) break;
            const prop = PROPERTIES_DB.find(p => p.id === propId);
            if (!prop) continue;
            
            let housesToSell = 0;
            let currentCount = count;
            
            while (currentCount > 0 && balance < cost) {
                const sellValue = prop.houseCost * SELL_BANK_RATE;
                balance += sellValue;
                payer.assets = Math.max(0, safeNum(payer.assets) - prop.houseCost);
                currentCount--;
                housesToSell++;
            }
            
            if (housesToSell > 0) {
                payer.houses[propId] = currentCount;
                if (payer.houses[propId] === 0) delete payer.houses[propId];
                notes.push(`Vendeu ${housesToSell} casas em ${prop.name}`);
            }
        }
        payer.balance = balance;
    }

    // 3. Penhorar Imóveis
    if (balance < cost && payer.properties) {
        const propsToSell = [...payer.properties];
        let propsSold = [];
        
        for (const propId of propsToSell) {
            if (balance >= cost) break;
            const prop = PROPERTIES_DB.find(p => p.id === propId);
            if (!prop) continue;
            if ((payer.houses && payer.houses[propId] > 0)) continue; 
            if ((payer.mortgaged || []).includes(propId)) continue;

            const sellValue = prop.price * SELL_BANK_RATE;
            balance += sellValue;
            payer.assets = Math.max(0, safeNum(payer.assets) - prop.price);
            
            payer.properties = payer.properties.filter(id => id !== propId);
            propsSold.push(prop.name);
        }
        
        if (propsSold.length > 0) notes.push(`Penhorou: ${propsSold.join(', ')}`);
        payer.balance = balance;
    }
    
    // 4. Empréstimo Automático
    if (balance < cost) {
        const deficit = cost - balance;
        const debt = safeNum(payer.debt);
        const assets = safeNum(payer.assets);
        const creditLimit = Math.max(0, assets * LOAN_LIMIT_PERCENT);
        
        const n = 10;
        const i = getInterestRate(payer.creditScore);
        const pmt = Math.floor(deficit * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1));
        const totalNewDebt = pmt * n;

        if ((debt + totalNewDebt) <= creditLimit) {
            payer.balance = 0;
            payer.debt = debt + totalNewDebt;
            if (!payer.activeLoans) payer.activeLoans = [];
            payer.activeLoans.push({ 
                id: Date.now().toString() + Math.random(), 
                originalAmount: deficit, totalDue: totalNewDebt, 
                installments: n, remainingInstallments: n, installmentValue: pmt 
            });
            notes.push(`Empréstimo Auto: ${formatCurrency(deficit)}`);
            return { success: true, log: notes.length > 0 ? ` (${notes.join(', ')})` : '' };
        }
        return { success: false, log: notes.length > 0 ? ` (Tentou: ${notes.join(', ')})` : '' };
    }

    payer.balance = balance - cost;
    return { success: true, log: notes.length > 0 ? ` (${notes.join(', ')})` : '' };
};

export const performPassTurn = (room) => {
    let order = room.turnOrder;
    let skipNote = '';

    if (!order || order.length === 0) {
        order = Object.keys(room.players);
        room.turnOrder = order;
    }
    
    if (!room.gameDate) room.gameDate = { day: 1, month: 1, year: 1, totalTurns: 0 };
    room.gameDate.totalTurns++;
    room.gameDate.day++;
    
    Object.values(room.players).forEach(p => {
        if (!p.scoreHistory) p.scoreHistory = [p.creditScore || 500];
        p.scoreHistory.push(p.creditScore || 500);
        if (p.scoreHistory.length > 20) p.scoreHistory.shift();
    });

    if (!room.weather || room.gameDate.totalTurns % 3 === 0) {
        const weathers = ['Sol', 'Chuva', 'Nublado'];
        const oldWeather = room.weather;
        room.weather = weathers[Math.floor(Math.random() * weathers.length)];
        if (room.weather !== oldWeather) {
            let weatherNote = room.weather === 'Sol' ? 'Tempo ensolarado, mercado em alta!' : (room.weather === 'Chuva' ? 'Chuva forte, mercado em baixa.' : 'Tempo nublado, sem efeitos.');
            if (!room.transactions) room.transactions = [];
            room.transactions.unshift({
                id: Date.now().toString() + Math.random(), timestamp: Date.now(), type: 'event', amount: 0,
                note: `Clima: ${room.weather}`, description: weatherNote, from: 'BANK', to: 'ALL', senderName: 'Sistema', receiverName: 'Todos'
            });
        }
    }

    if (room.activeEvents) {
        room.activeEvents.forEach(e => e.duration--);
        room.activeEvents = room.activeEvents.filter(e => e.duration > 0);
    }

    if (room.gameDate.day > 5) {
        room.gameDate.day = 1;
        room.gameDate.month++;
        if (room.gameDate.month > 12) { room.gameDate.month = 1; room.gameDate.year++; }

        const m = room.gameDate.month;
        if (m === 4) {
            let taxApplied = false;
            Object.keys(room.players).forEach(pid => {
                const p = room.players[pid];
                const netWorth = safeNum(p.balance) + safeNum(p.assets) - safeNum(p.debt);
                if (netWorth > 0) {
                    const tax = Math.floor(netWorth * 0.05);
                    if (tax > 0) {
                        p.balance = safeNum(p.balance) - tax;
                        room.bankReserve += tax;
                        if (!room.transactions) room.transactions = [];
                        room.transactions.unshift({
                            id: Date.now().toString() + Math.random(), timestamp: Date.now(), type: 'expense', amount: tax,
                            note: 'Imposto de Renda', description: `Receita Federal: ${p.name} pagou ${formatCurrency(tax)}`,
                            from: pid, to: 'BANK', senderName: p.name, receiverName: 'Banco'
                        });
                        taxApplied = true;
                    }
                }
            });
            if (taxApplied) skipNote += ' | Imposto de Renda (5%)';
        }
        
        if (m === 11) {
            room.activeEvents = [...(room.activeEvents || []), { id: 'black_friday', name: 'Black Friday', duration: 3 }];
            skipNote += ` | BLACK FRIDAY! Imóveis com 20% OFF!`;
        }

        if (m === 12) {
            const bonus = 100000;
            Object.values(room.players).forEach(p => {
                p.balance = safeNum(p.balance) + bonus;
                if (!room.transactions) room.transactions = [];
                room.transactions.unshift({
                    id: Date.now().toString() + Math.random(), timestamp: Date.now(), type: 'income', amount: bonus,
                    note: 'Bônus de Natal', description: `Natal: ${p.name} ganhou ${formatCurrency(bonus)}`,
                    from: 'BANK', to: p.id, senderName: 'Banco', receiverName: p.name
                });
            });
            skipNote += ` | Feliz Natal! Bônus de ${formatCurrency(bonus)}`;
        }
        
        for (const pid of Object.keys(room.players)) {
            const p = room.players[pid];
            if (p.creditScore === undefined) p.creditScore = 500;
            if (p.activeLoans && p.activeLoans.length > 0) {
                let totalInstallment = 0;
                let loansToKeep = [];
                p.activeLoans.forEach(loan => {
                    if (loan.remainingInstallments > 0) {
                        totalInstallment += loan.installmentValue;
                        loan.remainingInstallments--;
                        p.debt = Math.max(0, safeNum(p.debt) - loan.installmentValue);
                        if (loan.remainingInstallments > 0) loansToKeep.push(loan);
                    }
                });
                p.activeLoans = loansToKeep;
                if (totalInstallment > 0) {
                    const payResult = processMandatoryPayment(room, totalInstallment, pid);
                    if (payResult.success) {
                        room.bankReserve += totalInstallment;
                        if (!room.transactions) room.transactions = [];
                        room.transactions.unshift({
                            id: Date.now().toString() + Math.random(), timestamp: Date.now(), type: 'expense', amount: totalInstallment,
                            note: 'Débito Automático', description: `Empréstimo: ${p.name} pagou parcela de ${formatCurrency(totalInstallment)}`,
                            from: pid, to: 'BANK', senderName: p.name, receiverName: 'Banco'
                        });
                        p.creditScore = Math.min(1000, p.creditScore + 15);
                    } else {
                        p.balance = 0; p.assets = 0; p.properties = []; p.houses = {};
                    }
                }
            }
        }
    }

    let currentIdx = order.indexOf(room.currentPlayerId);
    if (currentIdx === -1) currentIdx = 0;

    let nextPlayerId = null;
    let attempts = 0;

    while (!nextPlayerId && attempts < order.length) {
        currentIdx = (currentIdx + 1) % order.length;
        const candidateId = order[currentIdx];
        const candidate = room.players[candidateId];
        
        if (!candidate) { attempts++; continue; }

        if (safeNum(candidate.frozenTurns) > 0) {
            candidate.frozenTurns = safeNum(candidate.frozenTurns) - 1;
            skipNote += ` | ${candidate.name}: Burnout (${candidate.frozenTurns} restantes)`;
        } else if (candidate.isJailed) {
            const turnsLeft = (candidate.jailTurns || 0) - 1;
            candidate.jailTurns = turnsLeft;
            if (turnsLeft <= 0) {
                const payResult = processMandatoryPayment(room, JAIL_BAIL, candidateId);
                if (payResult.success) {
                    candidate.isJailed = false;
                    candidate.jailTurns = 0;
                    room.bankReserve = (room.bankReserve || BANK_START_RESERVE) + JAIL_BAIL;
                    skipNote += ` | ${candidate.name}: Saiu da Cadeia${payResult.log}`;
                    nextPlayerId = candidateId;
                } else {
                    skipNote += ` | ${candidate.name}: Continua Preso (Sem $)`;
                }
            } else {
                skipNote += ` | ${candidate.name}: Preso (${turnsLeft} rodadas)`;
            }
        } else {
            nextPlayerId = candidateId;
        }
        attempts++;
    }

    if (nextPlayerId) room.currentPlayerId = nextPlayerId;
    return skipNote;
};
