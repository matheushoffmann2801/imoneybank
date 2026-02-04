// c:\Users\Admin\imoney-local\server_modules\gameUtils.js

export const safeNum = (val) => { 
    const num = parseFloat(val); 
    return (isNaN(num) || !isFinite(num)) ? 0 : num; 
};

export const formatCurrency = (val) => '$ ' + safeNum(val).toLocaleString('pt-BR');

export const getInterestRate = (score) => {
    const s = score !== undefined ? score : 500;
    if (s >= 900) return 0.01; // 1% - Excelente
    if (s >= 700) return 0.03; // 3% - Bom
    if (s >= 500) return 0.05; // 5% - Normal
    if (s >= 300) return 0.07; // 7% - Ruim
    return 0.10;               // 10% - Péssimo
};
