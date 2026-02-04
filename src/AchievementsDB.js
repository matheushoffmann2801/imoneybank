import { safeNum } from './utils';

export const ACHIEVEMENTS_DB = [
    {
        id: 'first_step',
        title: 'Primeiro Passo',
        description: 'Compre seu primeiro imóvel.',
        reward: 50000,
        condition: (p) => (p.properties || []).length >= 1
    },
    {
        id: 'real_estate_tycoon',
        title: 'Corretor',
        description: 'Possua 5 imóveis em seu nome.',
        reward: 200000,
        condition: (p) => (p.properties || []).length >= 5
    },
    {
        id: 'collector',
        title: 'Colecionador',
        description: 'Possua 10 imóveis.',
        reward: 500000,
        condition: (p) => (p.properties || []).length >= 10
    },
    {
        id: 'map_owner',
        title: 'Dono do Mapa',
        description: 'Possua 15 imóveis.',
        reward: 1000000,
        condition: (p) => (p.properties || []).length >= 15
    },
    {
        id: 'millionaire',
        title: 'Milionário',
        description: 'Tenha $ 1.000.000 em caixa.',
        reward: 100000,
        condition: (p) => safeNum(p.balance) >= 1000000
    },
    {
        id: 'multimillionaire',
        title: 'Multimilionário',
        description: 'Tenha $ 5.000.000 em caixa.',
        reward: 500000,
        condition: (p) => safeNum(p.balance) >= 5000000
    },
    {
        id: 'billionaire',
        title: 'Bilionário',
        description: 'Tenha $ 10.000.000 em caixa.',
        reward: 1000000,
        condition: (p) => safeNum(p.balance) >= 10000000
    },
    {
        id: 'builder',
        title: 'Construtor',
        description: 'Construa 5 casas/hotéis no total.',
        reward: 150000,
        condition: (p) => {
            const houses = p.houses || {};
            return Object.values(houses).reduce((a, b) => a + b, 0) >= 5;
        }
    },
    {
        id: 'engineer',
        title: 'Engenheiro',
        description: 'Construa 15 casas/hotéis no total.',
        reward: 400000,
        condition: (p) => {
            const houses = p.houses || {};
            return Object.values(houses).reduce((a, b) => a + b, 0) >= 15;
        }
    },
    {
        id: 'urbanist',
        title: 'Urbanista',
        description: 'Construa 30 casas/hotéis no total.',
        reward: 1000000,
        condition: (p) => {
            const houses = p.houses || {};
            return Object.values(houses).reduce((a, b) => a + b, 0) >= 30;
        }
    },
    {
        id: 'hotelier',
        title: 'Hoteleiro',
        description: 'Possua pelo menos 1 Hotel (5 casas).',
        reward: 300000,
        condition: (p) => {
            const houses = p.houses || {};
            return Object.values(houses).some(h => h >= 5);
        }
    },
    {
        id: 'hotel_chain',
        title: 'Rede de Hotéis',
        description: 'Possua 3 Hotéis.',
        reward: 1000000,
        condition: (p) => {
            const houses = p.houses || {};
            return Object.values(houses).filter(h => h >= 5).length >= 3;
        }
    },
    {
        id: 'monopoly_king',
        title: 'Monopólio',
        description: 'Complete um grupo de cor.',
        reward: 250000,
        condition: (p, db) => {
            const groups = {};
            db.forEach(prop => {
                if (prop.group === 'company' || prop.group === 'special') return;
                if (!groups[prop.group]) groups[prop.group] = [];
                groups[prop.group].push(prop.id);
            });
            return Object.values(groups).some(groupIds => groupIds.every(id => (p.properties || []).includes(id)));
        }
    },
    {
        id: 'dominator',
        title: 'Dominador',
        description: 'Complete 3 grupos de cor.',
        reward: 1000000,
        condition: (p, db) => {
            const groups = {};
            db.forEach(prop => {
                if (prop.group === 'company' || prop.group === 'special') return;
                if (!groups[prop.group]) groups[prop.group] = [];
                groups[prop.group].push(prop.id);
            });
            let completed = 0;
            Object.values(groups).forEach(groupIds => {
                if (groupIds.every(id => (p.properties || []).includes(id))) completed++;
            });
            return completed >= 3;
        }
    },
    {
        id: 'industrial',
        title: 'Industrial',
        description: 'Possua 2 Companhias.',
        reward: 200000,
        condition: (p, db) => {
            const companies = db.filter(prop => prop.group === 'company' || prop.group === 'special').map(prop => prop.id);
            const owned = (p.properties || []).filter(id => companies.includes(id));
            return owned.length >= 2;
        }
    },
    {
        id: 'conglomerate',
        title: 'Conglomerado',
        description: 'Possua 4 Companhias.',
        reward: 500000,
        condition: (p, db) => {
            const companies = db.filter(prop => prop.group === 'company' || prop.group === 'special').map(prop => prop.id);
            const owned = (p.properties || []).filter(id => companies.includes(id));
            return owned.length >= 4;
        }
    },
    {
        id: 'good_payer',
        title: 'Bom Pagador',
        description: 'Alcance Score de Crédito 700.',
        reward: 100000,
        condition: (p) => (p.creditScore || 500) >= 700
    },
    {
        id: 'premium_credit',
        title: 'Crédito Premium',
        description: 'Alcance Score de Crédito 900.',
        reward: 300000,
        condition: (p) => (p.creditScore || 500) >= 900
    },
    {
        id: 'big_saver',
        title: 'Poupador',
        description: 'Patrimônio Líquido > $ 5.000.000.',
        reward: 250000,
        condition: (p) => (safeNum(p.balance) + safeNum(p.assets) - safeNum(p.debt)) >= 5000000
    },
    {
        id: 'ostentation',
        title: 'Ostentação',
        description: 'Patrimônio Líquido > $ 15.000.000.',
        reward: 1000000,
        condition: (p) => (safeNum(p.balance) + safeNum(p.assets) - safeNum(p.debt)) >= 15000000
    }
];
