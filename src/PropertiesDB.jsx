import React from 'react';
import { 
  GraduationCap, Building, Trees, ShieldCheck, PartyPopper, Building2, 
  ShoppingBag, Car, Fuel, Landmark, CreditCard, TrendingUp, Siren, 
  Plane, Stethoscope, Zap, Warehouse, Smartphone 
} from 'lucide-react';

// --- ICONES AUXILIARES ---
const LaptopIcon = ({size, className}) => <div className={className} style={{width: size, height: size, border: '1.5px solid currentColor', borderRadius: 2}}></div>;

export const TOURISM_IDS = ['av_beira_mar', 'av_niemeyer', 'jardim_botanico', 'marina_gloria', 'barra_tijuca', 'ponte_rio_niteroi'];

// --- DADOS DOS IMÓVEIS ---
export const PROPERTIES_DB = [
  { id: 'av_beira_mar', name: 'Av. Beira Mar', group: 'light_green', price: 60000, rent: 2000, rent1: 10000, rent2: 30000, rent3: 90000, rent4: 160000, rentHotel: 250000, houseCost: 50000 },
  { id: 'av_niemeyer', name: 'Av. Niemeyer', group: 'light_green', price: 75000, rent: 4000, rent1: 20000, rent2: 60000, rent3: 180000, rent4: 320000, rentHotel: 450000, houseCost: 50000 },
  { id: 'jardim_botanico', name: 'Jardim Botânico', group: 'light_green', price: 100000, rent: 6000, rent1: 30000, rent2: 90000, rent3: 270000, rent4: 400000, rentHotel: 500000, houseCost: 50000 },
  { id: 'av_ipiranga', name: 'Av. Ipiranga', group: 'purple', price: 100000, rent: 8000, rent1: 40000, rent2: 100000, rent3: 300000, rent4: 450000, rentHotel: 600000, houseCost: 50000 },
  { id: 'av_sao_joao', name: 'Av. São João', group: 'purple', price: 120000, rent: 6000, rent1: 30000, rent2: 90000, rent3: 270000, rent4: 400000, rentHotel: 500000, houseCost: 50000 },
  { id: 'higienopolis', name: 'Higienópolis', group: 'pink', price: 400000, rent: 50000, rent1: 200000, rent2: 600000, rent3: 1400000, rent4: 1700000, rentHotel: 2000000, houseCost: 200000 },
  { id: 'jardins', name: 'Jardins', group: 'pink', price: 350000, rent: 35000, rent1: 175000, rent2: 500000, rent3: 1100000, rent4: 1300000, rentHotel: 1500000, houseCost: 200000 },
  { id: 'av_juscelino', name: 'Av. Juscelino K.', group: 'red', price: 240000, rent: 20000, rent1: 100000, rent2: 300000, rent3: 750000, rent4: 925000, rentHotel: 1100000, houseCost: 150000 },
  { id: 'av_ibirapuera', name: 'Av. Ibirapuera', group: 'red', price: 220000, rent: 18000, rent1: 90000, rent2: 250000, rent3: 700000, rent4: 875000, rentHotel: 1050000, houseCost: 150000 },
  { id: 'rua_oscar_freire', name: 'Rua Oscar Freire', group: 'red', price: 220000, rent: 18000, rent1: 90000, rent2: 250000, rent3: 700000, rent4: 875000, rentHotel: 1050000, houseCost: 150000 },
  { id: 'av_recife', name: 'Av. Recife', group: 'dark_green', price: 140000, rent: 10000, rent1: 50000, rent2: 150000, rent3: 450000, rent4: 625000, rentHotel: 750000, houseCost: 100000 },
  { id: 'ponte_guaiba', name: 'Ponte do Guaíba', group: 'dark_green', price: 140000, rent: 10000, rent1: 50000, rent2: 150000, rent3: 450000, rent4: 625000, rentHotel: 750000, houseCost: 100000 },
  { id: 'av_paulista', name: 'Av. Paulista', group: 'dark_green', price: 160000, rent: 12000, rent1: 60000, rent2: 180000, rent3: 500000, rent4: 700000, rentHotel: 900000, houseCost: 100000 },
  { id: 'viaduto_cha', name: 'Viaduto do Chá', group: 'dark_blue', price: 180000, rent: 14000, rent1: 70000, rent2: 200000, rent3: 550000, rent4: 750000, rentHotel: 950000, houseCost: 100000 },
  { id: 'rua_consolacao', name: 'Rua da Consolação', group: 'dark_blue', price: 180000, rent: 14000, rent1: 70000, rent2: 200000, rent3: 550000, rent4: 750000, rentHotel: 950000, houseCost: 100000 },
  { id: 'praca_se', name: 'Praça da Sé', group: 'dark_blue', price: 200000, rent: 16000, rent1: 80000, rent2: 220000, rent3: 600000, rent4: 800000, rentHotel: 1000000, houseCost: 100000 },
  { id: 'ponte_rio_niteroi', name: 'Ponte Rio-Niterói', group: 'yellow', price: 280000, rent: 26000, rent1: 130000, rent2: 360000, rent3: 850000, rent4: 1025000, rentHotel: 1200000, houseCost: 150000 },
  { id: 'marina_gloria', name: 'Marina da Glória', group: 'yellow', price: 260000, rent: 22000, rent1: 110000, rent2: 330000, rent3: 800000, rent4: 975000, rentHotel: 1150000, houseCost: 150000 },
  { id: 'barra_tijuca', name: 'Barra da Tijuca', group: 'yellow', price: 260000, rent: 22000, rent1: 110000, rent2: 330000, rent3: 800000, rent4: 975000, rentHotel: 1150000, houseCost: 150000 },
  { id: 'av_contorno', name: 'Av. do Contorno', group: 'orange', price: 300000, rent: 26000, rent1: 130000, rent2: 390000, rent3: 900000, rent4: 1100000, rentHotel: 1275000, houseCost: 200000 },
  { id: 'praca_castro_alves', name: 'Praça Castro Alves', group: 'orange', price: 300000, rent: 26000, rent1: 130000, rent2: 390000, rent3: 900000, rent4: 1100000, rentHotel: 1275000, houseCost: 200000 },
  { id: 'praca_tres_poderes', name: 'Praça dos Três Poderes', group: 'orange', price: 320000, rent: 28000, rent1: 150000, rent2: 450000, rent3: 1000000, rent4: 1200000, rentHotel: 1400000, houseCost: 200000 },
  { id: 'cia_mineracao', name: 'Cia de Mineração', group: 'company', price: 200000, multiplier: 50000, type: 'company', rent: 50000 },
  { id: 'cia_petrolifera', name: 'Cia Petrolífera', group: 'company', price: 200000, multiplier: 50000, type: 'company', rent: 50000 },
  { id: 'cia_agua', name: 'Cia Água e Saneam.', group: 'company', price: 200000, multiplier: 50000, type: 'company', rent: 50000 },
  { id: 'central_forca', name: 'Central Força e Luz', group: 'company', price: 200000, multiplier: 50000, type: 'company', rent: 50000 },
  { id: 'credito_carbono', name: 'Créditos de Carbono', group: 'special', price: 150000, multiplier: 40000, type: 'company', rent: 40000 },
  { id: 'ponto_com', name: 'Ponto.com', group: 'special', price: 150000, multiplier: 40000, type: 'company', rent: 40000 },
];

export const COLORS = {
  purple: 'bg-purple-500', dark_green: 'bg-emerald-700', dark_blue: 'bg-blue-800',
  red: 'bg-red-500', yellow: 'bg-yellow-400', orange: 'bg-orange-500',
  pink: 'bg-pink-500', light_green: 'bg-emerald-400', company: 'bg-slate-700', special: 'bg-cyan-500'
};

export const NEIGHBORHOOD_SERVICES = {
    purple: { label: 'Cultural', icon: GraduationCap, level1: { name: 'Biblioteca', icon: Building, threshold: 2, bonus: 0.2 }, level2: { name: 'Universidade', icon: GraduationCap, threshold: 4, bonus: 0.5 } },
    light_green: { label: 'Litoral', icon: Trees, level1: { name: 'Salva-Vidas', icon: ShieldCheck, threshold: 3, bonus: 0.2 }, level2: { name: 'Resort', icon: PartyPopper, threshold: 6, bonus: 0.5 } },
    pink: { label: 'Nobre', icon: Building2, level1: { name: 'Boutique', icon: ShoppingBag, threshold: 2, bonus: 0.2 }, level2: { name: 'Shopping', icon: Building2, threshold: 4, bonus: 0.5 } },
    red: { label: 'Comércio', icon: Car, level1: { name: 'Mecânica', icon: Fuel, threshold: 3, bonus: 0.2 }, level2: { name: 'Corporativo', icon: Building, threshold: 6, bonus: 0.5 } },
    dark_green: { label: 'Financeiro', icon: Landmark, level1: { name: 'Caixa Elet.', icon: CreditCard, threshold: 3, bonus: 0.2 }, level2: { name: 'Bolsa', icon: TrendingUp, threshold: 6, bonus: 0.5 } },
    dark_blue: { label: 'Histórico', icon: ShieldCheck, level1: { name: 'Posto Pol.', icon: ShieldCheck, threshold: 3, bonus: 0.2 }, level2: { name: 'Delegacia', icon: Siren, threshold: 6, bonus: 0.5 } },
    yellow: { label: 'Turismo', icon: Plane, level1: { name: 'Táxi', icon: Car, threshold: 3, bonus: 0.2 }, level2: { name: 'Aeroporto', icon: Plane, threshold: 6, bonus: 0.5 } },
    orange: { label: 'Cívico', icon: Stethoscope, level1: { name: 'Posto Saúde', icon: Stethoscope, threshold: 3, bonus: 0.2 }, level2: { name: 'Hospital', icon: Building2, threshold: 6, bonus: 0.5 } },
    company: { label: 'Indústria', icon: Zap, level1: { name: 'Galpão', icon: Warehouse, threshold: 1, bonus: 0.1 }, level2: { name: 'Usina', icon: Zap, threshold: 3, bonus: 0.2 } },
    special: { label: 'Tech', icon: Smartphone, level1: { name: 'Startup', icon: LaptopIcon, threshold: 1, bonus: 0.1 }, level2: { name: 'Campus', icon: Smartphone, threshold: 2, bonus: 0.2 } }
};
