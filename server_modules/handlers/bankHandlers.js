import { safeNum, formatCurrency, getInterestRate } from '../gameUtils.js';
import { BANK_START_RESERVE, LOAN_LIMIT_PERCENT } from '../gameData.js';
import { processMandatoryPayment } from '../logicHelpers.js';

export const transfer = (room, { userId, finalAmount, note, pTarget }) => {
    const payResult = processMandatoryPayment(room, finalAmount, userId);
    if (!payResult.success) throw new Error("FALÊNCIA: Saldo insuficiente");
    if (pTarget) pTarget.balance = safeNum(pTarget.balance) + finalAmount;
    return { desc: `Pix: ${note}${payResult.log}` };
};

export const income = (room, { userId, finalAmount, note, pSender }) => {
    pSender.balance = safeNum(pSender.balance) + finalAmount;
    return { desc: note || 'Recebimento', fromId: 'BANK', toId: userId };
};

export const expense = (room, { userId, finalAmount, note, pSender }) => {
    const payResult = processMandatoryPayment(room, finalAmount, userId);
    if (!payResult.success) throw new Error("FALÊNCIA");
    room.bankReserve = (room.bankReserve || BANK_START_RESERVE) + finalAmount;
    if (finalAmount >= 100000) pSender.creditScore = Math.max(0, (pSender.creditScore || 500) - 20);
    return { desc: (note || 'Pagamento ao Banco') + payResult.log };
};

export const loan_take = (room, { userId, finalAmount, note, pSender }) => {
    const installments = parseInt(note) || 10;
    if (installments < 1 || installments > 6) throw new Error("Parcelamento máximo de 6x");
    const equity = safeNum(pSender.assets);
    const currentDebt = safeNum(pSender.debt);
    const limit = Math.max(0, equity * LOAN_LIMIT_PERCENT);
    const i = getInterestRate(pSender.creditScore);
    const pmt = Math.floor(finalAmount * (i * Math.pow(1 + i, installments)) / (Math.pow(1 + i, installments) - 1));
    const totalDebt = pmt * installments;

    if ((currentDebt + finalAmount) > limit) throw new Error(`Limite excedido! Máx: ${formatCurrency(limit)}`);
    
    pSender.balance = safeNum(pSender.balance) + finalAmount;
    pSender.debt = currentDebt + totalDebt;
    if (!pSender.activeLoans) pSender.activeLoans = [];
    pSender.activeLoans.push({ id: Date.now().toString(), originalAmount: finalAmount, totalDue: totalDebt, installments, remainingInstallments: installments, installmentValue: pmt });

    return { desc: `Empréstimo: ${formatCurrency(finalAmount)} em x`, fromId: 'BANK' };
};

export const loan_pay = (room, { userId, finalAmount, pSender }) => {
    const currentDebt = safeNum(pSender.debt);
    const actualPayment = Math.min(finalAmount, currentDebt);
    if (actualPayment <= 0) throw new Error("Valor inválido ou sem dívida.");
    if (!processMandatoryPayment(room, actualPayment, userId).success) throw new Error("FALÊNCIA");
    pSender.debt = currentDebt - actualPayment;
    pSender.creditScore = Math.min(1000, (pSender.creditScore || 500) + 25);
    return { desc: `Pagou Empréstimo`, amount: actualPayment };
};

export const pay_loan_percent = (room, { userId, amount, pSender }) => {
    const currentDebt = safeNum(pSender.debt);
    const toPay = currentDebt * amount;
    if (toPay > 0) {
        const payResult = processMandatoryPayment(room, toPay, userId);
        if (!payResult.success) throw new Error("FALÊNCIA");
        pSender.debt = Math.max(0, currentDebt - toPay);
        return { desc: `Pagou % Dívida${payResult.log}`, amount: toPay };
    }
    return { desc: `Sorte: Sem dívida para pagar %`, amount: 0 };
};

export const pay_all = (room, { userId, amount, note }) => {
    const otherPlayers = Object.values(room.players).filter(p => p.id !== userId);
    const totalCost = amount * otherPlayers.length;
    const payResult = processMandatoryPayment(room, totalCost, userId);
    if (!payResult.success) throw new Error("FALÊNCIA");
    otherPlayers.forEach(p => { p.balance = safeNum(p.balance) + amount; });
    return { desc: `Revés:  (Pagou a todos)${payResult.log}`, amount: totalCost };
};

export const receive_all = (room, { userId, amount, note, pSender }) => {
    const otherPlayers = Object.values(room.players).filter(p => p.id !== userId);
    let totalReceived = 0;
    otherPlayers.forEach(p => {
        processMandatoryPayment(room, amount, p.id);
        totalReceived += amount;
    });
    pSender.balance = safeNum(pSender.balance) + totalReceived;
    return { desc: `Sorte:  (Recebeu de todos)`, amount: totalReceived };
};
