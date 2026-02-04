import { safeNum, formatCurrency, getInterestRate } from './gameUtils.js';
import { 
    INITIAL_BALANCE, BANK_START_RESERVE, LOAN_LIMIT_PERCENT, SELL_BANK_RATE, JAIL_BAIL,
    TOURISM_IDS, ITEM_NAMES, PROPERTIES_DB 
} from './gameData.js';

// Lógica de Pagamento Obrigatório (Auto-Liquidação)
const processMandatoryPayment = (room, cost, payerId) => {
    const payer = room.players[payerId];
    let balance = safeNum(payer.balance);
    let notes = [];

    // 1. Tenta pagar com saldo
    if (balance >= cost) { 
         payer.balance = balance - cost;
         return { success: true, log: '' };
    }

    // 2. Vender Casas (Liquidação de Benfeitorias)
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

    // 3. Penhorar Imóveis (Venda para o Banco)
    if (balance < cost && payer.properties) {
        const propsToSell = [...payer.properties];
        let propsSold = [];
        
        for (const propId of propsToSell) {
            if (balance >= cost) break;
            
            const prop = PROPERTIES_DB.find(p => p.id === propId);
            if (!prop) continue;
            
            // Só vende se não tiver casas (já tratadas acima)
            if ((payer.houses && payer.houses[propId] > 0)) continue; 

            // Se estiver hipotecado, não gera caixa na venda ao banco (já recebeu 50%)
            if ((payer.mortgaged || []).includes(propId)) continue;

            const sellValue = prop.price * SELL_BANK_RATE;
            balance += sellValue;
            payer.assets = Math.max(0, safeNum(payer.assets) - prop.price);
            
            payer.properties = payer.properties.filter(id => id !== propId);
            propsSold.push(prop.name);
        }
        
        if (propsSold.length > 0) {
            notes.push(`Penhorou: ${propsSold.join(', ')}`);
        }
        payer.balance = balance;
    }
    
    // 4. Empréstimo Automático (Último Recurso)
    if (balance < cost) {
        const deficit = cost - balance;
        const debt = safeNum(payer.debt);
        const assets = safeNum(payer.assets);
        const creditLimit = Math.max(0, assets * LOAN_LIMIT_PERCENT);
        
        // Simulação de empréstimo de 10x para cobrir o déficit
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
                originalAmount: deficit, 
                totalDue: totalNewDebt, 
                installments: n, 
                remainingInstallments: n, 
                installmentValue: pmt 
            });
            
            notes.push(`Empréstimo Auto: ${formatCurrency(deficit)}`);
            return { success: true, log: notes.length > 0 ? ` (${notes.join(', ')})` : '' };
        }
        
        // Falência
        return { success: false, log: notes.length > 0 ? ` (Tentou: ${notes.join(', ')})` : '' };
    }

    // Pagamento com sucesso após liquidações
    payer.balance = balance - cost;
    return { success: true, log: notes.length > 0 ? ` (${notes.join(', ')})` : '' };
};

// Helper para passar a vez
const performPassTurn = (room) => {
    let order = room.turnOrder;
    let skipNote = '';

    // Fallback de segurança se a ordem estiver corrompida
    if (!order || order.length === 0) {
        order = Object.keys(room.players);
        room.turnOrder = order;
    }
    
    // --- SISTEMA DE CALENDÁRIO ---
    if (!room.gameDate) room.gameDate = { day: 1, month: 1, year: 1, totalTurns: 0 };
    
    room.gameDate.totalTurns++;
    room.gameDate.day++;
    
    // --- HISTÓRICO DE SCORE (Snapshot a cada rodada) ---
    Object.values(room.players).forEach(p => {
        if (!p.scoreHistory) p.scoreHistory = [p.creditScore || 500];
        p.scoreHistory.push(p.creditScore || 500);
        if (p.scoreHistory.length > 20) p.scoreHistory.shift(); // Mantém últimos 20 pontos
    });

    // --- SISTEMA DE CLIMA (Muda a cada 3 rodadas) ---
    if (!room.weather || room.gameDate.totalTurns % 3 === 0) {
        const weathers = ['Sol', 'Chuva', 'Nublado'];
        const oldWeather = room.weather;
        room.weather = weathers[Math.floor(Math.random() * weathers.length)];
        if (room.weather !== oldWeather) {
            let weatherNote = '';
            if (room.weather === 'Sol') weatherNote = 'Tempo ensolarado, mercado em alta!';
            else if (room.weather === 'Chuva') weatherNote = 'Chuva forte, mercado em baixa.';
            else weatherNote = 'Tempo nublado, sem efeitos.';
            
            if (!room.transactions) room.transactions = [];
            room.transactions.unshift({
                id: Date.now().toString() + Math.random(),
                timestamp: Date.now(),
                type: 'event',
                amount: 0,
                note: `Clima: ${room.weather}`,
                description: weatherNote,
                from: 'BANK',
                to: 'ALL',
                senderName: 'Sistema',
                receiverName: 'Todos'
            });
        }
    }

    // --- GERENCIAR EVENTOS ATIVOS ---
    if (room.activeEvents) {
        room.activeEvents.forEach(e => e.duration--);
        room.activeEvents = room.activeEvents.filter(e => e.duration > 0);
    }

    // ALTERAÇÃO: Reduzido de 10 para 5 dias para acelerar o jogo
    if (room.gameDate.day > 5) {
        room.gameDate.day = 1;
        room.gameDate.month++;
        if (room.gameDate.month > 12) {
            room.gameDate.month = 1;
            room.gameDate.year++;
        }

        // --- EVENTOS SAZONAIS ---
        const m = room.gameDate.month;
        
        // Mês 4: Imposto de Renda (Taxa de 5% do patrimônio líquido)
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
                        
                        // Transação de Imposto
                        if (!room.transactions) room.transactions = [];
                        room.transactions.unshift({
                            id: Date.now().toString() + Math.random(),
                            timestamp: Date.now(),
                            type: 'expense',
                            amount: tax,
                            note: 'Imposto de Renda',
                            description: `Receita Federal: ${p.name} pagou ${formatCurrency(tax)}`,
                            from: pid,
                            to: 'BANK',
                            senderName: p.name,
                            receiverName: 'Banco'
                        });
                        taxApplied = true;
                    }
                }
            });
            if (taxApplied) skipNote += ' | Imposto de Renda (5%)';
        }
        
        // Mês 11: Black Friday (Dura 3 rodadas)
        if (m === 11) {
            room.activeEvents = [...(room.activeEvents || []), { id: 'black_friday', name: 'Black Friday', duration: 3 }];
            skipNote += ` | BLACK FRIDAY! Imóveis com 20% OFF!`;
        }

        // Mês 12: Natal (Bônus para todos)
        if (m === 12) {
            const bonus = 100000;
            Object.values(room.players).forEach(p => {
                p.balance = safeNum(p.balance) + bonus;
                
                // Transação de Bônus
                if (!room.transactions) room.transactions = [];
                room.transactions.unshift({
                    id: Date.now().toString() + Math.random(),
                    timestamp: Date.now(),
                    type: 'income',
                    amount: bonus,
                    note: 'Bônus de Natal',
                    description: `Natal: ${p.name} ganhou ${formatCurrency(bonus)}`,
                    from: 'BANK',
                    to: p.id,
                    senderName: 'Banco',
                    receiverName: p.name
                });
            });
            skipNote += ` | Feliz Natal! Bônus de ${formatCurrency(bonus)}`;
        }
        
        // --- SISTEMA BANCÁRIO: Cobrança Mensal (a cada 5 rodadas agora) ---
        // Cobra de TODOS os jogadores na virada do mês
        for (const pid of Object.keys(room.players)) {
            const p = room.players[pid];
            // Inicializa Score se não existir
            if (p.creditScore === undefined) p.creditScore = 500;

            if (p.activeLoans && p.activeLoans.length > 0) {
                let totalInstallment = 0;
                let loansToKeep = [];
                
                p.activeLoans.forEach(loan => {
                    if (loan.remainingInstallments > 0) {
                        totalInstallment += loan.installmentValue;
                        loan.remainingInstallments--;
                        // Abate do montante total da dívida (visual)
                        p.debt = Math.max(0, safeNum(p.debt) - loan.installmentValue);
                        
                        if (loan.remainingInstallments > 0) loansToKeep.push(loan);
                    }
                });
                
                p.activeLoans = loansToKeep;
                
                if (totalInstallment > 0) {
                    const payResult = processMandatoryPayment(room, totalInstallment, pid);
                    if (payResult.success) {
                        room.bankReserve += totalInstallment;
                        
                        // Transação de Pagamento de Empréstimo
                        if (!room.transactions) room.transactions = [];
                        room.transactions.unshift({
                            id: Date.now().toString() + Math.random(),
                            timestamp: Date.now(),
                            type: 'expense',
                            amount: totalInstallment,
                            note: 'Débito Automático',
                            description: `Empréstimo: ${p.name} pagou parcela de ${formatCurrency(totalInstallment)}`,
                            from: pid,
                            to: 'BANK',
                            senderName: p.name,
                            receiverName: 'Banco'
                        });
                        
                        // Bônus de Score por pagar em dia
                        p.creditScore = Math.min(1000, p.creditScore + 15);
                    } else {
                        // Jogador faliu na virada do mês
                        p.balance = 0;
                        p.assets = 0;
                        p.properties = [];
                        p.houses = {};
                    }
                }
            }
        }
    }

    let currentIdx = order.indexOf(room.currentPlayerId);
    if (currentIdx === -1) currentIdx = 0; // Fallback

    let nextPlayerId = null;
    let attempts = 0;

    // Loop para encontrar o próximo jogador válido (pula presos se necessário)
    while (!nextPlayerId && attempts < order.length) {
        currentIdx = (currentIdx + 1) % order.length;
        const candidateId = order[currentIdx];
        const candidate = room.players[candidateId];
        
        if (!candidate) { attempts++; continue; }

        if (safeNum(candidate.frozenTurns) > 0) {
            candidate.frozenTurns = safeNum(candidate.frozenTurns) - 1;
            skipNote += ` | ${candidate.name}: Burnout (${candidate.frozenTurns} restantes)`;
            // Continua o loop, pulando este jogador
        } else if (candidate.isJailed) {
            const turnsLeft = (candidate.jailTurns || 0) - 1;
            candidate.jailTurns = turnsLeft;
            
            if (turnsLeft <= 0) {
                // Tenta pagar fiança automaticamente se tiver saldo
                const payResult = processMandatoryPayment(room, JAIL_BAIL, candidateId);
                if (payResult.success) {
                    candidate.isJailed = false;
                    candidate.jailTurns = 0;
                    room.bankReserve = (room.bankReserve || BANK_START_RESERVE) + JAIL_BAIL;
                    skipNote += ` | ${candidate.name}: Saiu da Cadeia${payResult.log}`;
                    nextPlayerId = candidateId;
                } else {
                    // Se não tiver dinheiro, continua preso (ou fali, mas simplificamos aqui)
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

    if (nextPlayerId) {
        room.currentPlayerId = nextPlayerId;
    }
    return skipNote;
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

    if (isAdmin) {
        if (type === 'admin_add_money') {
            if (!pTarget) throw new Error("Alvo necessário");
            pTarget.balance = safeNum(pTarget.balance) + finalAmount;
            desc = `BC: Crédito de ${formatCurrency(finalAmount)} para ${pTarget.name}`;
            fromId = 'BANK';
            toId = targetId;
        }
        else if (type === 'admin_remove_money') {
            if (!pTarget) throw new Error("Alvo necessário");
            // Admin force remove doesn't trigger bankruptcy logic, just subtraction
            pTarget.balance = safeNum(pTarget.balance) - finalAmount;
            desc = `BC: Débito de ${formatCurrency(finalAmount)} de ${pTarget.name}`;
            fromId = targetId;
            toId = 'BANK';
        }
        else if (type === 'admin_seize_prop') {
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
            
            desc = `BC: Penhora de ${prop.name} (${pTarget.name})`;
            fromId = targetId;
            toId = 'BANK';
        }
        else if (type === 'pass_turn') {
             const skipNote = performPassTurn(room);
             desc = 'BC: Forçou Passar a Vez' + (skipNote || '');
             finalAmount = 0;
             fromId = 'ADMIN';
             toId = 'BANK';
        }
        else if (type === 'admin_jail') {
             if (!pTarget) throw new Error("Alvo necessário");
             pTarget.isJailed = true;
             pTarget.jailTurns = 3;
             desc = `BC: Prendeu ${pTarget.name}`;
             fromId = 'ADMIN';
             toId = targetId;
        }
        else if (type === 'admin_unjail') {
             if (!pTarget) throw new Error("Alvo necessário");
             pTarget.isJailed = false;
             pTarget.jailTurns = 0;
             desc = `BC: Soltou ${pTarget.name}`;
             fromId = 'ADMIN';
             toId = targetId;
        }
        else if (type === 'admin_kick') {
             if (!pTarget) throw new Error("Alvo necessário");
             delete room.players[targetId];
             if (room.turnOrder) {
                 room.turnOrder = room.turnOrder.filter(id => id !== targetId);
             }
             if (room.currentPlayerId === targetId) {
                 performPassTurn(room);
             }
             desc = `BC: Expulsou ${pTarget.name}`;
             fromId = 'ADMIN';
             toId = targetId;
        }
        else if (type === 'admin_freeze') {
             if (!pTarget) throw new Error("Alvo necessário");
             pTarget.frozenTurns = (pTarget.frozenTurns || 0) + 2;
             desc = `BC: Congelou ${pTarget.name}`;
             fromId = 'ADMIN';
             toId = targetId;
        }
        else if (type === 'admin_add_item') {
             if (!pTarget) throw new Error("Alvo necessário");
             pTarget.inventory = [...(pTarget.inventory || []), note];
             desc = `BC: Deu item ${ITEM_NAMES[note] || note} para ${pTarget.name}`;
             fromId = 'ADMIN';
             toId = targetId;
             finalAmount = 0;
        }
        else if (type === 'global_earthquake') {
             let destroyedCount = 0;
             let victims = [];
             
             Object.values(room.players).forEach(p => {
                 if (p.houses && Object.keys(p.houses).length > 0) {
                     const propsWithHouses = Object.keys(p.houses).filter(pid => p.houses[pid] > 0);
                     if (propsWithHouses.length > 0) {
                         const randomPropId = propsWithHouses[Math.floor(Math.random() * propsWithHouses.length)];
                         p.houses[randomPropId]--;
                         if (p.houses[randomPropId] === 0) delete p.houses[randomPropId];
                         
                         // Atualiza patrimônio (perda do valor da casa)
                         const prop = PROPERTIES_DB.find(x => x.id === randomPropId);
                         if (prop) {
                             p.assets = Math.max(0, safeNum(p.assets) - prop.houseCost);
                         }
                         
                         destroyedCount++;
                         victims.push(p.name);
                     }
                 }
             });
             
             desc = destroyedCount > 0 
                ? `TERREMOTO! Casas destruídas de: ${victims.join(', ')}` 
                : `TERREMOTO! Mas ninguém tinha casas.`;
             finalAmount = 0;
             fromId = 'ADMIN';
             toId = 'BANK';
        }
    }
    else if (type === 'transfer') {
        const payResult = processMandatoryPayment(room, finalAmount, userId);
        if (!payResult.success) throw new Error("FALÊNCIA: Saldo insuficiente");
        if (pTarget) pTarget.balance = safeNum(pTarget.balance) + finalAmount;
        desc = `Pix: ${note}${payResult.log}`;
    } 
    else if (type === 'income') {
        pSender.balance = safeNum(pSender.balance) + finalAmount;
        desc = note || 'Recebimento'; fromId = 'BANK'; toId = userId;
    }
    else if (type === 'expense') {
        const payResult = processMandatoryPayment(room, finalAmount, userId);
        if (!payResult.success) throw new Error("FALÊNCIA");
        room.bankReserve = (room.bankReserve || BANK_START_RESERVE) + finalAmount;
        // Penalidade de Score para prejuízos altos (> 100k)
        if (finalAmount >= 100000) {
            pSender.creditScore = Math.max(0, (pSender.creditScore || 500) - 20);
        }
        desc = (note || 'Pagamento ao Banco') + payResult.log;
    }
    else if (type === 'buy_prop') {
        const prop = PROPERTIES_DB.find(p => p.id === propId);
        if (!prop) throw new Error("Imóvel inválido");

        // Validação: Verifica se já tem dono (Impede sobrescrever na compra normal)
        const isOwned = Object.values(room.players).some(p => (p.properties || []).includes(propId));
        if (isOwned) throw new Error("Imóvel já possui dono!");

        // Validação: Máximo de 3 empresas
        if (prop.group === 'company' || prop.group === 'special') {
            const myProps = pSender.properties || [];
            const myCompanies = myProps.filter(pid => {
                const p = PROPERTIES_DB.find(dbP => dbP.id === pid);
                return p && (p.group === 'company' || p.group === 'special');
            });
            if (myCompanies.length >= 3) throw new Error("Máximo de 3 empresas por jogador!");
        }

        // Segurança: Força o preço do servidor
        finalAmount = prop.price;

        // --- EVENTO: BLACK FRIDAY ---
        const isBlackFriday = (room.activeEvents || []).some(e => e.id === 'black_friday');
        if (isBlackFriday) {
            finalAmount = Math.floor(finalAmount * 0.8); // 20% de desconto
            desc = `Comprou (Black Friday): ${prop.name}`;
        }

        if (safeNum(pSender.balance) < finalAmount) throw new Error("Saldo insuficiente");
        pSender.balance -= finalAmount;
        pSender.properties = [...(pSender.properties || []), propId];
        pSender.assets = safeNum(pSender.assets) + finalAmount;
        room.bankReserve += finalAmount;
        desc = `Comprou: ${prop.name}`;
    }
    else if (type === 'steal_prop') {
        // Lógica de roubo
        const idx = (pSender.inventory || []).indexOf('steal_prop');
        if (idx === -1) throw new Error("Você não tem o item Usucapião!");

        // Validação: Não pode roubar imóvel hipotecado
        const owner = pTarget;
        if (owner && (owner.mortgaged || []).includes(propId)) throw new Error("Imóvel hipotecado! Não pode ser roubado.");

        if (pTarget) {
            // Validação: Verifica se o grupo tem construções
            const prop = PROPERTIES_DB.find(p => p.id === propId);
            if (prop) {
                const groupProps = PROPERTIES_DB.filter(p => p.group === prop.group);
                const hasHousesInGroup = groupProps.some(p => (pTarget.houses || {})[p.id] > 0);
                if (hasHousesInGroup) throw new Error("Grupo possui construções! Não é permitido roubar.");
            }

            pTarget.properties = (pTarget.properties || []).filter(id => id !== propId);
            const propVal = PROPERTIES_DB.find(p => p.id === propId)?.price || 0;
            pTarget.assets = Math.max(0, safeNum(pTarget.assets) - propVal);
            
            // Remove casas se houver (simplificado)
            if (pTarget.houses && pTarget.houses[propId]) delete pTarget.houses[propId];

            pSender.properties = [...(pSender.properties || []), propId];
            pSender.assets = safeNum(pSender.assets) + propVal;
        }
        
        pSender.inventory.splice(idx, 1);
        desc = `Roubou Imóvel: ${note}`;
        finalAmount = 0; // Ação sem custo monetário direto na transação
    }
    else if (type === 'go_to_jail') {
        pSender.isJailed = true;
        pSender.jailTurns = 3;
        pSender.jailCount = (pSender.jailCount || 0) + 1;
        
        // Penalidade severa no Score
        pSender.creditScore = Math.max(0, (pSender.creditScore || 500) - 100);
        
        const currentDebt = safeNum(pSender.debt);
        let penaltyLog = '';

        if (currentDebt > 0) {
            const isRecidivist = pSender.jailCount > 1;
            const penaltyFactor = isRecidivist ? 1.0 : 0.5; // 100% se reincidente, 50% se 1ª vez
            const penaltyAmount = Math.floor(currentDebt * penaltyFactor);
            
            const payResult = processMandatoryPayment(room, penaltyAmount, userId);
            if (!payResult.success) throw new Error("FALÊNCIA: Bens insuficientes para pagar a pena da prisão.");
            
            // Abate a dívida paga
            pSender.debt = Math.max(0, currentDebt - penaltyAmount);
            
            // Ajusta os empréstimos ativos proporcionalmente
            if (pSender.activeLoans) {
                pSender.activeLoans.forEach(l => {
                    l.totalDue = Math.floor(l.totalDue * (1 - penaltyFactor));
                    l.installmentValue = Math.floor(l.installmentValue * (1 - penaltyFactor));
                });
                if (isRecidivist) pSender.activeLoans = [];
            }
            penaltyLog = ` (Pagou ${isRecidivist ? '100%' : '50%'} da dívida${payResult.log})`;
        }

        desc = `Foi para a Cadeia${penaltyLog}`;
        finalAmount = 0;
        // Passar a vez automaticamente ao ser preso
        const skipNote = performPassTurn(room);
        if (skipNote) desc += skipNote;
    }
    else if (type === 'add_inventory') {
        pSender.inventory = [...(pSender.inventory || []), note];
        desc = `Item: ${ITEM_NAMES[note] || note}`;
        fromId = 'BANK';
    }
    else if (type === 'use_black_card') {
        const currentDebt = safeNum(pSender.debt);
        if (currentDebt <= 0) throw new Error("Sem dívidas!");
        
        const idx = (pSender.inventory || []).indexOf('black_card');
        if (idx === -1) throw new Error("Item não encontrado");
        pSender.inventory.splice(idx, 1);

        pSender.debt = 0;
        desc = `Usou Cartão Black (Quitou ${formatCurrency(currentDebt)})`;
        finalAmount = 0;
    }
    else if (type === 'use_habeas_corpus') {
        if (!pSender.isJailed) throw new Error("Você não está preso!");
        
        const idx = (pSender.inventory || []).indexOf('habeas_corpus');
        if (idx === -1) throw new Error("Item não encontrado");
        pSender.inventory.splice(idx, 1);

        pSender.isJailed = false;
        pSender.jailTurns = 0;
        desc = 'Usou Habeas Corpus';
        finalAmount = 0;
    }
    else if (type === 'force_buy') {
        const idx = (pSender.inventory || []).indexOf('free_buy');
        if (idx === -1) throw new Error("Você não tem o item Compra Livre!");
        
        const prop = PROPERTIES_DB.find(p => p.id === propId);
        if (!prop) throw new Error("Imóvel inválido");

        // Validação: Não pode usar Compra Livre em imóvel hipotecado
        const owner = pTarget; // pTarget é o dono atual
        if (owner && (owner.mortgaged || []).includes(propId)) throw new Error("Imóvel hipotecado! Não pode ser comprado.");

        // Validação: Máximo de 3 empresas
        if (prop.group === 'company' || prop.group === 'special') {
            const myProps = pSender.properties || [];
            const myCompanies = myProps.filter(pid => {
                const p = PROPERTIES_DB.find(dbP => dbP.id === pid);
                return p && (p.group === 'company' || p.group === 'special');
            });
            if (myCompanies.length >= 3) throw new Error("Máximo de 3 empresas por jogador!");
        }

        // Validação: Verifica se o grupo tem construções
        if (pTarget) {
             const groupProps = PROPERTIES_DB.filter(p => p.group === prop.group);
             const hasHousesInGroup = groupProps.some(p => (pTarget.houses || {})[p.id] > 0);
             if (hasHousesInGroup) throw new Error("Grupo possui construções! Não é permitido comprar.");
        }

        // Segurança: Força o preço do servidor
        finalAmount = prop.price;

        if (safeNum(pSender.balance) < finalAmount) throw new Error("Saldo insuficiente!");
        
        pSender.inventory.splice(idx, 1);
        pSender.balance -= finalAmount;
        
        // Remove do dono anterior
        if (pTarget) {
             pTarget.properties = (pTarget.properties || []).filter(id => id !== propId);
             pTarget.balance = safeNum(pTarget.balance) + finalAmount;
             
             // Remove casas se houver
             if (pTarget.houses && pTarget.houses[propId]) delete pTarget.houses[propId];

             pTarget.assets = Math.max(0, safeNum(pTarget.assets) - finalAmount);
        } else {
             room.bankReserve += finalAmount;
        }

        pSender.properties = [...(pSender.properties || []), propId];
        pSender.assets = safeNum(pSender.assets) + finalAmount;
        
        desc = `Compra Livre: ${note}`;
    }
    else if (type === 'pay_loan_percent') {
        const currentDebt = safeNum(pSender.debt);
        const toPay = currentDebt * amount; // amount is percentage (0.20)
        if (toPay > 0) {
            const payResult = processMandatoryPayment(room, toPay, userId);
            if (!payResult.success) throw new Error("FALÊNCIA");
            pSender.debt = Math.max(0, currentDebt - toPay);
            desc = `Pagou % Dívida${payResult.log}`;
            finalAmount = toPay;
        } else {
            desc = `Sorte: Sem dívida para pagar %`;
            finalAmount = 0;
        }
    }
    else if (type === 'pay_all') {
        const otherPlayers = Object.values(room.players).filter(p => p.id !== userId);
        const totalCost = amount * otherPlayers.length;
        const payResult = processMandatoryPayment(room, totalCost, userId);
        if (!payResult.success) throw new Error("FALÊNCIA");
        
        otherPlayers.forEach(p => {
            p.balance = safeNum(p.balance) + amount;
        });
        desc = `Revés: ${note} (Pagou a todos)${payResult.log}`;
        finalAmount = totalCost;
    }
    else if (type === 'receive_all') {
        const otherPlayers = Object.values(room.players).filter(p => p.id !== userId);
        let totalReceived = 0;
        otherPlayers.forEach(p => {
            // Simplificação: Jogadores pagam o que tem, o resto vira dívida
            const payResult = processMandatoryPayment(room, amount, p.id);
            totalReceived += amount;
        });
        pSender.balance = safeNum(pSender.balance) + totalReceived;
        desc = `Sorte: ${note} (Recebeu de todos)`;
        finalAmount = totalReceived;
    }
    else if (type === 'pass_turn') {
        const skipNote = performPassTurn(room);
        desc = 'Passou a Vez' + (skipNote || '');
        finalAmount = 0;
    }
    else if (type === 'freeze_player') {
        pSender.frozenTurns = 2; // Define 2 rodadas sem jogar
        desc = 'Burnout: 2 rodadas sem jogar';
        finalAmount = 0;
        const skipNote = performPassTurn(room); // Passa a vez imediatamente
        if (skipNote) desc += skipNote;
    }
    else if (type === 'charge_rent') {
        if (!pTarget) throw new Error("Alvo inválido");
        let weatherEffect = '';
        
        // --- CLIMA: Efeito Global (Todas as propriedades) ---
        if (room.weather === 'Sol') {
            finalAmount = Math.floor(finalAmount * 1.2); // +20%
            weatherEffect = ' (+20% Sol)';
        } else if (room.weather === 'Chuva') {
            finalAmount = Math.floor(finalAmount * 0.8); // -20%
            weatherEffect = ' (-20% Chuva)';
        }

        const payResult = processMandatoryPayment(room, finalAmount, targetId);

        if (!payResult.success) throw new Error("Jogador alvo faliu!");
        pSender.balance = safeNum(pSender.balance) + finalAmount;
        desc = `Aluguel: ${note}${weatherEffect}${payResult.log}`;
        fromId = targetId;
        toId = userId;
    }
    else if (type === 'pay_rent') {
        if (!pTarget) throw new Error("Alvo inválido");
        let weatherEffect = '';

        // --- CLIMA: Efeito Global (Todas as propriedades) ---
        if (room.weather === 'Sol') {
            finalAmount = Math.floor(finalAmount * 1.2);
            weatherEffect = ' (+20% Sol)';
        } else if (room.weather === 'Chuva') {
            finalAmount = Math.floor(finalAmount * 0.8);
            weatherEffect = ' (-20% Chuva)';
        }

        const payResult = processMandatoryPayment(room, finalAmount, userId);

        if (!payResult.success) throw new Error("FALÊNCIA");
        pTarget.balance = safeNum(pTarget.balance) + finalAmount;
        desc = `Aluguel: ${note}${weatherEffect}${payResult.log}`;
        toId = targetId;
    }
    else if (type === 'pay_bank_rent') {
        let weatherEffect = '';
        // Aplica clima se for pagamento de aluguel/taxa de imóvel
        if (propId) {
            if (room.weather === 'Sol') {
                finalAmount = Math.floor(finalAmount * 1.2);
                weatherEffect = ' (+20% Sol)';
            } else if (room.weather === 'Chuva') {
                finalAmount = Math.floor(finalAmount * 0.8);
                weatherEffect = ' (-20% Chuva)';
            }
        }
        const payResult = processMandatoryPayment(room, finalAmount, userId);
        if (!payResult.success) throw new Error("FALÊNCIA");
        room.bankReserve = (room.bankReserve || BANK_START_RESERVE) + finalAmount;
        desc = `Taxa Banco: ${note}${weatherEffect}${payResult.log}`;
    }
    else if (type === 'build') {
        const prop = PROPERTIES_DB.find(p => p.id === propId);
        if (!prop) throw new Error("Imóvel inválido");
        
        // Segurança: Força o custo do servidor
        finalAmount = prop.houseCost;
        
        const houses = pSender.houses || {};
        const currentCount = houses[propId] || 0;
        if (currentCount >= 5) throw new Error("Máximo de construções atingido");
        
        // Validação: Monopólio e Uniformidade
        const groupProps = PROPERTIES_DB.filter(p => p.group === prop.group);
        const playerProps = pSender.properties || [];
        
        // 1. Verifica se tem o grupo completo
        if (!groupProps.every(p => playerProps.includes(p.id))) {
            throw new Error("Você precisa ter o grupo completo para construir!");
        }

        // 2. Verifica se algum imóvel do grupo está hipotecado
        if (groupProps.some(p => (pSender.mortgaged || []).includes(p.id))) {
            throw new Error("Não pode construir! Há imóveis hipotecados no grupo.");
        }

        // 2. Verifica uniformidade (não pode construir se houver imóvel com menos casas)
        const minHouses = Math.min(...groupProps.map(p => houses[p.id] || 0));
        if (currentCount > minHouses) throw new Error("Construa uniformemente! Distribua as casas no grupo.");

        if (safeNum(pSender.balance) < finalAmount) throw new Error("Saldo insuficiente");
        
        pSender.balance -= finalAmount;
        pSender.assets = safeNum(pSender.assets) + finalAmount;
        if (!pSender.houses) pSender.houses = {};
        pSender.houses[propId] = currentCount + 1;

        room.bankReserve += finalAmount;
        desc = `Construção: ${prop.name} (+1 Cupom)`;
    }
    else if (type === 'sell_house') {
        const prop = PROPERTIES_DB.find(p => p.id === propId);
        if (!prop) throw new Error("Imóvel inválido");
        const houses = pSender.houses || {};
        const currentCount = houses[propId] || 0;
        if (currentCount <= 0) throw new Error("Sem casas para vender");

        // Validação: Uniformidade na venda
        const groupProps = PROPERTIES_DB.filter(p => p.group === prop.group);
        const maxHouses = Math.max(...groupProps.map(p => houses[p.id] || 0));
        if (currentCount < maxHouses) throw new Error("Venda uniformemente! Venda do imóvel com mais casas.");
        
        const sellValue = (prop.houseCost * SELL_BANK_RATE);
        
        pSender.balance = safeNum(pSender.balance) + sellValue;
        pSender.assets = Math.max(0, safeNum(pSender.assets) - prop.houseCost);
        pSender.houses[propId] = currentCount - 1;
        
        desc = `Vendeu Casa: ${prop.name}`;
        // Penalidade leve no Score
        pSender.creditScore = Math.max(0, (pSender.creditScore || 500) - 15);
        finalAmount = sellValue;
    }
    else if (type === 'sell_bank') {
        const prop = PROPERTIES_DB.find(p => p.id === propId);
        if (!prop) throw new Error("Imóvel inválido");
        if (!(pSender.properties || []).includes(propId)) throw new Error("Você não possui este imóvel");
        if ((pSender.mortgaged || []).includes(propId)) throw new Error("Imóvel hipotecado! Resgate antes de vender.");
        
        const houses = (pSender.houses || {})[propId] || 0;
        const totalValue = prop.price + (houses * prop.houseCost);
        const sellValue = totalValue * SELL_BANK_RATE;
        
        pSender.balance = safeNum(pSender.balance) + sellValue;
        pSender.properties = pSender.properties.filter(id => id !== propId);
        pSender.assets = Math.max(0, safeNum(pSender.assets) - totalValue);
        if (pSender.houses) delete pSender.houses[propId];
        // Penalidade média no Score
        pSender.creditScore = Math.max(0, (pSender.creditScore || 500) - 30);
        
        desc = `Vendeu ao Banco: ${prop.name}`;
        finalAmount = sellValue;
    }
    else if (type === 'start_game') {
        const playerIds = Object.keys(room.players);
        if (playerIds.length < 2) throw new Error("Precisa de 2 jogadores!");
        const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
        room.gameStarted = true;
        room.turnOrder = shuffled;
        room.currentPlayerId = shuffled[0];

        desc = `Jogo Iniciado! Começa: ${room.players[shuffled[0]].name}`;
        fromId = 'BANK';
    }
    else if (type === 'vote_restart') {
        const votes = room.restartVotes || [];
        if (!votes.includes(userId)) {
            room.restartVotes = [...votes, userId];
            const totalPlayers = Object.keys(room.players).length;
            if (room.restartVotes.length > (totalPlayers / 2)) {
                room.gameStarted = false;
                room.winner = null;
                room.restartVotes = [];
                room.currentPlayerId = null;
                room.transactions = [];
                room.offers = [];
                room.bankReserve = BANK_START_RESERVE;
                Object.values(room.players).forEach(p => {
                    p.balance = INITIAL_BALANCE;
                    p.assets = 0;
                    p.debt = 0;
                    p.properties = [];
                    p.houses = {};
                    p.isJailed = false;
                    p.inventory = [];
                    p.creditScore = 500;
                });
                desc = 'Jogo Reiniciado (Votação)';
            } else {
                desc = `Votou para Reiniciar (${room.restartVotes.length}/${totalPlayers})`;
            }
        } else {
            throw new Error("Já votou!");
        }
    }
    else if (type === 'quit_game' || type === 'bankrupt') {
        room.bankReserve = (room.bankReserve || BANK_START_RESERVE) + safeNum(pSender.balance);
        
        pSender.balance = 0;
        pSender.assets = 0;
        pSender.debt = 0;
        pSender.properties = [];
        pSender.inventory = [];
        pSender.houses = {};
        pSender.isJailed = false;
        
        desc = type === 'bankrupt' ? 'Falência Declarada' : 'Desistiu do Jogo';
        
        if (room.currentPlayerId === userId) {
            performPassTurn(room);
        }
        
        const activePlayers = Object.values(room.players).filter(p => p.id !== userId && (safeNum(p.balance) + safeNum(p.assets)) > 0);
        if (activePlayers.length === 1) {
            room.winner = activePlayers[0].id;
        }
    }
    else if (type === 'claim_achievement') {
        if ((pSender.achievements || []).includes(propId)) throw new Error("Conquista já resgatada!");
        pSender.balance = safeNum(pSender.balance) + finalAmount;
        pSender.achievements = [...(pSender.achievements || []), propId];
        desc = `Conquista: ${note}`;
        fromId = 'BANK';
    }
    else if (type === 'loan_take') {
        const installments = parseInt(note) || 10;
        if (installments < 1 || installments > 6) throw new Error("Parcelamento máximo de 6x");

        const equity = safeNum(pSender.assets);
        const currentDebt = safeNum(pSender.debt);
        const limit = Math.max(0, equity * LOAN_LIMIT_PERCENT);
        
        // Sistema Price: PMT = PV * (i * (1+i)^n) / ((1+i)^n - 1)
        const i = getInterestRate(pSender.creditScore);
        const n = installments;
        const pmt = Math.floor(finalAmount * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1));
        const totalDebt = pmt * n;

        if ((currentDebt + finalAmount) > limit) throw new Error(`Limite de crédito excedido (80% dos bens)! Máx: ${formatCurrency(limit)}`);
        
        pSender.balance = safeNum(pSender.balance) + finalAmount;
        pSender.debt = currentDebt + totalDebt;
        
        if (!pSender.activeLoans) pSender.activeLoans = [];
        pSender.activeLoans.push({ id: Date.now().toString(), originalAmount: finalAmount, totalDue: totalDebt, installments: n, remainingInstallments: n, installmentValue: pmt });

        desc = `Empréstimo: ${formatCurrency(finalAmount)} em ${n}x`;
        fromId = 'BANK';
    }
    else if (type === 'loan_pay') {
        const currentDebt = safeNum(pSender.debt);
        // Correção: Limita o pagamento ao valor real da dívida
        const actualPayment = Math.min(finalAmount, currentDebt);
        
        if (actualPayment <= 0) throw new Error("Valor inválido ou sem dívida.");
        
        if (!processMandatoryPayment(room, actualPayment, userId).success) throw new Error("FALÊNCIA");
        pSender.debt = currentDebt - actualPayment;
        // Bônus de Score por pagar empréstimo
        pSender.creditScore = Math.min(1000, (pSender.creditScore || 500) + 25);
        desc = `Pagou Empréstimo`;
        finalAmount = actualPayment;
    }
    else if (type === 'pay_bail') {
        if (!pSender.isJailed) throw new Error("Você não está preso!");
        if (!processMandatoryPayment(room, JAIL_BAIL, userId).success) throw new Error("FALÊNCIA");
        
        pSender.isJailed = false;
        pSender.jailTurns = 0;
        room.bankReserve = (room.bankReserve || BANK_START_RESERVE) + JAIL_BAIL;
        
        desc = 'Pagou Fiança';
        finalAmount = JAIL_BAIL;
    }
    else if (type === 'pay_private_debt') {
        // Validação: Verifica se a dívida existe
        const debtItem = (pSender.privateDebts || []).find(d => d.id === note);
        if (!debtItem) throw new Error("Dívida não encontrada ou já paga.");

        if (!processMandatoryPayment(room, finalAmount, userId).success) throw new Error("FALÊNCIA");
        if (pTarget) pTarget.balance = safeNum(pTarget.balance) + finalAmount;
        // Remove a dívida específica (ID passado em 'note')
        pSender.privateDebts = (pSender.privateDebts || []).filter(d => d.id !== note);
        desc = `Pagou Dívida a Jogador`;
        toId = targetId;
    }
    else if (type === 'make_offer' || type === 'make_trade_offer') {
        const isSelling = (pSender.properties || []).includes(propId);
        let offerType = 'buy';
        if (type === 'make_trade_offer') offerType = 'trade';
        else if (isSelling) offerType = 'sell';

        // Validação: Não pode vender/trocar imóvel hipotecado
        if (isSelling && (pSender.mortgaged || []).includes(propId)) throw new Error("Imóvel hipotecado! Não pode ser negociado.");
        
        const newOffer = {
            id: Date.now().toString(),
            from: userId,
            to: targetId,
            propId: propId,
            propName: note, // Frontend envia nome aqui para make_offer
            amount: finalAmount,
            status: 'pending',
            type: offerType,
            timestamp: Date.now()
        };
        
        if (type === 'make_trade_offer') {
             const tradeProp = PROPERTIES_DB.find(p => p.id === note); // note é tradePropId
             const myProp = PROPERTIES_DB.find(p => p.id === propId);

             // Validação: O imóvel que eu quero receber não pode estar hipotecado
             if (pTarget && (pTarget.mortgaged || []).includes(note)) throw new Error("O imóvel alvo está hipotecado!");

             newOffer.tradePropId = note;
             newOffer.tradePropName = tradeProp ? tradeProp.name : 'Desconhecido';
             newOffer.propName = myProp ? myProp.name : 'Desconhecido';
             desc = `Proposta de Troca: ${newOffer.propName} ⟷ ${newOffer.tradePropName}`;
        } else {
             desc = isSelling ? `Ofereceu vender ${note} por ${formatCurrency(finalAmount)}` : `Fez oferta de ${formatCurrency(finalAmount)} em ${note}`;
        }
        room.offers = [...(room.offers || []), newOffer];
        toId = targetId;
    }
    else if (type === 'reject_offer') {
        room.offers = (room.offers || []).filter(o => o.id !== targetId);
        desc = `Recusou proposta`;
    }
    else if (type === 'accept_offer') {
        const offerId = targetId;
        const offerIndex = (room.offers || []).findIndex(o => o.id === offerId);
        if (offerIndex === -1) throw new Error("Oferta não encontrada");
        const offer = room.offers[offerIndex];
        
        // Atualiza o valor final para aparecer no histórico
        finalAmount = Math.abs(offer.amount);
        
        if (offer.type === 'trade') {
             const proposer = room.players[offer.from]; // Quem propôs
             const accepter = room.players[userId];     // Quem aceitou (Você)
             
             // Lógica do Dinheiro (Baseado no App.jsx: Positivo = Proponente Recebe)
             const netAmount = offer.amount; 
             
             if (netAmount > 0) {
                 // Aceitante (userId) paga ao Proponente (offer.from)
                 if (safeNum(accepter.balance) < netAmount) throw new Error("Saldo insuficiente para aceitar (pagar volta)!");
                 accepter.balance = safeNum(accepter.balance) - netAmount;
                 proposer.balance = safeNum(proposer.balance) + netAmount;
             } else if (netAmount < 0) {
                 // Proponente (offer.from) paga ao Aceitante (userId)
                 const absAmount = Math.abs(netAmount);
                 if (safeNum(proposer.balance) < absAmount) throw new Error("Proponente sem saldo para pagar volta!");
                 proposer.balance = safeNum(proposer.balance) - absAmount;
                 accepter.balance = safeNum(accepter.balance) + absAmount;
             }

             // Troca de Propriedades
             // Proponente dá propId, recebe tradePropId
             // Aceitante dá tradePropId, recebe propId
             
             proposer.properties = (proposer.properties || []).filter(id => id !== offer.propId);
             accepter.properties = (accepter.properties || []).filter(id => id !== offer.tradePropId);
             
             proposer.properties.push(offer.tradePropId);
             accepter.properties.push(offer.propId);
             
             // Atualiza Patrimônio (Simplificado: valor de tabela)
             const propVal = PROPERTIES_DB.find(p => p.id === offer.propId)?.price || 0;
             const tradePropVal = PROPERTIES_DB.find(p => p.id === offer.tradePropId)?.price || 0;
             
             proposer.assets = safeNum(proposer.assets) - propVal + tradePropVal;
             accepter.assets = safeNum(accepter.assets) - tradePropVal + propVal;

             // Remove casas (Simplificado)
             if (proposer.houses && proposer.houses[offer.propId]) delete proposer.houses[offer.propId];
             if (accepter.houses && accepter.houses[offer.tradePropId]) delete accepter.houses[offer.tradePropId];

             desc = `Troca: ${offer.propName} ⟷ ${offer.tradePropName}`;
             fromId = offer.from;
             toId = userId;
        } else {
             // Compra e Venda
             const buyerId = offer.type === 'sell' ? userId : offer.from;
             const sellerId = offer.type === 'sell' ? offer.from : userId;
             const buyer = room.players[buyerId];
             const seller = room.players[sellerId];

             if (safeNum(buyer.balance) < offer.amount) throw new Error("Comprador sem saldo!");
             
             buyer.balance = safeNum(buyer.balance) - offer.amount;
             seller.balance = safeNum(seller.balance) + offer.amount;
             
             seller.properties = (seller.properties || []).filter(id => id !== offer.propId);
             buyer.properties = [...(buyer.properties || []), offer.propId];
             
             const propVal = PROPERTIES_DB.find(p => p.id === offer.propId)?.price || 0;
             seller.assets = Math.max(0, safeNum(seller.assets) - propVal);
             buyer.assets = safeNum(buyer.assets) + propVal;

             // Transferir casas (simplificado: remove casas ao vender)
             if (seller.houses && seller.houses[offer.propId]) delete seller.houses[offer.propId];
             
             desc = `Negócio Fechado: ${offer.propName}`;
             fromId = sellerId;
             toId = buyerId;
        }

        room.offers.splice(offerIndex, 1);
    }
    else if (type === 'start_auction') {
        if (room.auction && room.auction.status === 'active') throw new Error("Já existe um leilão em andamento!");
        
        // Validação: Não pode leiloar imóvel hipotecado
        if ((pSender.mortgaged || []).includes(propId)) throw new Error("Imóvel hipotecado! Não pode ser leiloado.");

        room.auction = {
            status: 'active',
            propId: propId, // ID do imóvel
            sellerId: userId, // Quem iniciou (dono)
            currentBid: finalAmount, // Valor inicial
            highestBidder: null,
            startTime: Date.now()
        };
        desc = `Iniciou Leilão: ${note} (Lance Inicial: ${formatCurrency(finalAmount)})`;
        fromId = userId;
    }
    else if (type === 'place_bid') {
        if (!room.auction || room.auction.status !== 'active') throw new Error("Nenhum leilão ativo!");
        if (finalAmount <= room.auction.currentBid) throw new Error("O lance deve ser maior que o atual!");
        if (safeNum(pSender.balance) < finalAmount) throw new Error("Saldo insuficiente para este lance!");

        room.auction.currentBid = finalAmount;
        room.auction.highestBidder = userId;
        
        desc = `Lance no Leilão: ${formatCurrency(finalAmount)}`;
        fromId = userId;
    }
    else if (type === 'end_auction') {
        if (!room.auction || room.auction.status !== 'active') throw new Error("Nenhum leilão ativo!");
        if (room.auction.sellerId !== userId) throw new Error("Apenas o vendedor pode encerrar o leilão!");

        const { highestBidder, currentBid, propId: auctionPropId } = room.auction;

        if (highestBidder) {
            const winner = room.players[highestBidder];
            const seller = pSender;

            if (safeNum(winner.balance) < currentBid) {
                room.auction = null; // Cancela se o ganhador não tiver dinheiro (bug safe)
                throw new Error("Ganhador sem saldo! Leilão cancelado.");
            }

            // Transfere dinheiro
            winner.balance = safeNum(winner.balance) - currentBid;
            seller.balance = safeNum(seller.balance) + currentBid;

            // Transfere propriedade
            seller.properties = (seller.properties || []).filter(id => id !== auctionPropId);
            winner.properties = [...(winner.properties || []), auctionPropId];

            // Atualiza Assets (Patrimônio)
            const propVal = PROPERTIES_DB.find(p => p.id === auctionPropId)?.price || 0;
            seller.assets = Math.max(0, safeNum(seller.assets) - propVal);
            winner.assets = safeNum(winner.assets) + propVal;

            desc = `Leilão Finalizado: ${note} vendido para ${winner.name} por ${formatCurrency(currentBid)}`;
        } else {
            desc = `Leilão Cancelado: ${note} (Sem lances)`;
        }
        room.auction = null; // Limpa o leilão
    }
    else if (type === 'mortgage_prop') {
        const prop = PROPERTIES_DB.find(p => p.id === propId);
        if (!prop) throw new Error("Imóvel inválido");
        if (!(pSender.properties || []).includes(propId)) throw new Error("Você não possui este imóvel");
        if ((pSender.houses || {})[propId] > 0) throw new Error("Venda as casas antes de hipotecar!");
        if ((pSender.mortgaged || []).includes(propId)) throw new Error("Já está hipotecado!");

        const mortgageValue = Math.floor(prop.price * 0.5);
        pSender.balance = safeNum(pSender.balance) + mortgageValue;
        pSender.assets = Math.max(0, safeNum(pSender.assets) - mortgageValue);
        pSender.mortgaged = [...(pSender.mortgaged || []), propId];
        
        desc = `Hipotecou: ${prop.name}`;
        finalAmount = mortgageValue;
        fromId = 'BANK';
        toId = userId;
    }
    else if (type === 'unmortgage_prop') {
        const prop = PROPERTIES_DB.find(p => p.id === propId);
        if (!prop) throw new Error("Imóvel inválido");
        if (!(pSender.mortgaged || []).includes(propId)) throw new Error("Não está hipotecado!");

        const liftCost = Math.floor(prop.price * 0.6); // 50% + 10% taxa
        if (safeNum(pSender.balance) < liftCost) throw new Error("Saldo insuficiente para resgatar!");

        pSender.balance -= liftCost;
        const originalValue = Math.floor(prop.price * 0.5);
        pSender.assets = safeNum(pSender.assets) + originalValue;
        pSender.mortgaged = pSender.mortgaged.filter(id => id !== propId);
        room.bankReserve += liftCost;

        desc = `Resgatou Hipoteca: ${prop.name}`;
        finalAmount = liftCost;
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
