import { safeNum, formatCurrency } from '../gameUtils.js';
import { PROPERTIES_DB } from '../gameData.js';
import { processMandatoryPayment } from '../logicHelpers.js';

export const start_auction = (room, { userId, finalAmount, propId, note, pSender }) => {
    if (room.auction && room.auction.status === 'active') throw new Error("Já existe um leilão!");
    if ((pSender.mortgaged || []).includes(propId)) throw new Error("Imóvel hipotecado!");
    room.auction = { status: 'active', propId, sellerId: userId, currentBid: finalAmount, highestBidder: null, startTime: Date.now() };
    return { desc: `Iniciou Leilão: ${note} (Lance: ${formatCurrency(finalAmount)})`, fromId: userId };
};

export const place_bid = (room, { userId, finalAmount, pSender }) => {
    if (!room.auction || room.auction.status !== 'active') throw new Error("Nenhum leilão ativo!");
    if (finalAmount <= room.auction.currentBid) throw new Error("Lance deve ser maior!");
    if (safeNum(pSender.balance) < finalAmount) throw new Error("Saldo insuficiente!");
    room.auction.currentBid = finalAmount;
    room.auction.highestBidder = userId;
    return { desc: `Lance no Leilão: ${formatCurrency(finalAmount)}`, fromId: userId };
};

export const end_auction = (room, { userId, note, pSender }) => {
    if (!room.auction || room.auction.status !== 'active') throw new Error("Nenhum leilão ativo!");
    if (room.auction.sellerId !== userId) throw new Error("Apenas o vendedor encerra!");
    const { highestBidder, currentBid, propId } = room.auction;
    if (highestBidder) {
        const winner = room.players[highestBidder];
        if (safeNum(winner.balance) < currentBid) { room.auction = null; throw new Error("Ganhador sem saldo!"); }
        winner.balance = safeNum(winner.balance) - currentBid;
        pSender.balance = safeNum(pSender.balance) + currentBid;
        pSender.properties = (pSender.properties || []).filter(id => id !== propId);
        winner.properties = [...(winner.properties || []), propId];
        const propVal = PROPERTIES_DB.find(p => p.id === propId)?.price || 0;
        pSender.assets = Math.max(0, safeNum(pSender.assets) - propVal);
        winner.assets = safeNum(winner.assets) + propVal;
        room.auction = null;
        return { desc: `Leilão Finalizado: ${note} vendido para ${winner.name} por ${formatCurrency(currentBid)}` };
    }
    room.auction = null;
    return { desc: `Leilão Cancelado: ${note} (Sem lances)` };
};

export const make_offer = (room, { userId, targetId, finalAmount, propId, note, pSender }) => {
    const isSelling = (pSender.properties || []).includes(propId);
    if (isSelling && (pSender.mortgaged || []).includes(propId)) throw new Error("Imóvel hipotecado!");
    const newOffer = { id: Date.now().toString(), from: userId, to: targetId, propId, propName: note, amount: finalAmount, status: 'pending', type: isSelling ? 'sell' : 'buy', timestamp: Date.now() };
    room.offers = [...(room.offers || []), newOffer];
    return { desc: isSelling ? `Ofereceu vender ${note} por ${formatCurrency(finalAmount)}` : `Fez oferta de ${formatCurrency(finalAmount)} em ${note}`, toId: targetId };
};

export const make_trade_offer = (room, { userId, targetId, finalAmount, propId, note, pTarget }) => {
    const tradeProp = PROPERTIES_DB.find(p => p.id === note);
    const myProp = PROPERTIES_DB.find(p => p.id === propId);
    if (pTarget && (pTarget.mortgaged || []).includes(note)) throw new Error("O imóvel alvo está hipotecado!");
    const newOffer = { id: Date.now().toString(), from: userId, to: targetId, propId, propName: myProp?.name, tradePropId: note, tradePropName: tradeProp?.name, amount: finalAmount, status: 'pending', type: 'trade', timestamp: Date.now() };
    room.offers = [...(room.offers || []), newOffer];
    return { desc: `Proposta de Troca: ${newOffer.propName} ⟷ ${newOffer.tradePropName}`, toId: targetId };
};

export const reject_offer = (room, { targetId }) => {
    room.offers = (room.offers || []).filter(o => o.id !== targetId);
    return { desc: `Recusou proposta` };
};

export const accept_offer = (room, { userId, targetId }) => {
    const offerIndex = (room.offers || []).findIndex(o => o.id === targetId);
    if (offerIndex === -1) throw new Error("Oferta não encontrada");
    const offer = room.offers[offerIndex];
    const amount = Math.abs(offer.amount);

    if (offer.type === 'trade') {
        const proposer = room.players[offer.from];
        const accepter = room.players[userId];
        if (offer.amount > 0) {
            if (safeNum(accepter.balance) < offer.amount) throw new Error("Saldo insuficiente!");
            accepter.balance -= offer.amount; proposer.balance += offer.amount;
        } else if (offer.amount < 0) {
            if (safeNum(proposer.balance) < amount) throw new Error("Proponente sem saldo!");
            proposer.balance -= amount; accepter.balance += amount;
        }
        proposer.properties = proposer.properties.filter(id => id !== offer.propId);
        accepter.properties = accepter.properties.filter(id => id !== offer.tradePropId);
        proposer.properties.push(offer.tradePropId);
        accepter.properties.push(offer.propId);
        const propVal = PROPERTIES_DB.find(p => p.id === offer.propId)?.price || 0;
        const tradePropVal = PROPERTIES_DB.find(p => p.id === offer.tradePropId)?.price || 0;
        proposer.assets = safeNum(proposer.assets) - propVal + tradePropVal;
        accepter.assets = safeNum(accepter.assets) - tradePropVal + propVal;
        if (proposer.houses) delete proposer.houses[offer.propId];
        if (accepter.houses) delete accepter.houses[offer.tradePropId];
        room.offers.splice(offerIndex, 1);
        return { desc: `Troca: ${offer.propName} ⟷ ${offer.tradePropName}`, fromId: offer.from, toId: userId, amount };
    } else {
        const buyerId = offer.type === 'sell' ? userId : offer.from;
        const sellerId = offer.type === 'sell' ? offer.from : userId;
        const buyer = room.players[buyerId];
        const seller = room.players[sellerId];
        if (safeNum(buyer.balance) < offer.amount) throw new Error("Comprador sem saldo!");
        buyer.balance -= offer.amount; seller.balance += offer.amount;
        seller.properties = seller.properties.filter(id => id !== offer.propId);
        buyer.properties = [...(buyer.properties || []), offer.propId];
        const propVal = PROPERTIES_DB.find(p => p.id === offer.propId)?.price || 0;
        seller.assets = Math.max(0, safeNum(seller.assets) - propVal);
        buyer.assets = safeNum(buyer.assets) + propVal;
        if (seller.houses) delete seller.houses[offer.propId];
        room.offers.splice(offerIndex, 1);
        return { desc: `Negócio Fechado: ${offer.propName}`, fromId: sellerId, toId: buyerId, amount: offer.amount };
    }
};

export const pay_private_debt = (room, { userId, targetId, finalAmount, note, pSender, pTarget }) => {
    const debtItem = (pSender.privateDebts || []).find(d => d.id === note);
    if (!debtItem) throw new Error("Dívida não encontrada.");
    if (!processMandatoryPayment(room, finalAmount, userId).success) throw new Error("FALÊNCIA");
    if (pTarget) pTarget.balance = safeNum(pTarget.balance) + finalAmount;
    pSender.privateDebts = pSender.privateDebts.filter(d => d.id !== note);
    return { desc: `Pagou Dívida a Jogador`, toId: targetId };
};
