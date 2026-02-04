import React from 'react';
import { Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import CompactModal from './CompactModal';

const PingDetailsModal = ({ onClose, stats, ping, isOffline, apiUrl }) => {
    const totalRequests = stats.success + stats.failed;
    const lossRate = totalRequests > 0 ? ((stats.failed / totalRequests) * 100).toFixed(1) : 0;
    
    const avgPing = stats.pings.length > 0 
        ? Math.round(stats.pings.reduce((a, b) => a + b, 0) / stats.pings.length) 
        : 0;
        
    const jitter = stats.pings.length > 1 
        ? Math.round(Math.abs(ping - avgPing)) 
        : 0;

    const qualityColor = isOffline ? 'text-red-500' : (ping < 100 ? 'text-emerald-500' : (ping < 300 ? 'text-yellow-500' : 'text-red-500'));
    const qualityText = isOffline ? 'OFFLINE' : (ping < 100 ? 'EXCELENTE' : (ping < 300 ? 'REGULAR' : 'RUIM'));

    return (
        <CompactModal title="Diagnóstico de Rede" onClose={onClose}>
            <div className="space-y-4">
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className={`mb-2 p-3 rounded-full bg-white shadow-sm border ${isOffline ? 'border-red-100' : 'border-gray-100'}`}>
                        {isOffline ? <WifiOff size={32} className="text-red-500"/> : <Wifi size={32} className={qualityColor}/>}
                    </div>
                    <h2 className={`text-3xl font-black ${qualityColor}`}>{isOffline ? '---' : `${ping}ms`}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{qualityText}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <Activity size={14} className="text-blue-500"/>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Jitter</span>
                        </div>
                        <p className="text-lg font-bold text-gray-800">{jitter}ms</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle size={14} className="text-orange-500"/>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Perda (Est.)</span>
                        </div>
                        <p className="text-lg font-bold text-gray-800">{lossRate}%</p>
                    </div>
                </div>

                <div className="bg-gray-900 text-white p-4 rounded-xl text-xs font-mono space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={isOffline ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>{isOffline ? 'DESCONECTADO' : 'CONECTADO'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Host:</span>
                        <span className="text-gray-300 truncate max-w-[150px]">{new URL(apiUrl).hostname}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Protocolo:</span>
                        <span className="text-gray-300">{new URL(apiUrl).protocol.replace(':','').toUpperCase()}</span>
                    </div>
                    <div className="border-t border-gray-700 my-2 pt-2 flex justify-between">
                        <span className="text-gray-400">Req. Sucesso:</span>
                        <span className="text-emerald-400">{stats.success}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Req. Falha:</span>
                        <span className="text-red-400">{stats.failed}</span>
                    </div>
                </div>
                
                <div className="h-24 bg-gray-50 rounded-xl border border-gray-100 p-2 flex items-end gap-1 relative overflow-hidden">
                    <p className="absolute top-2 left-2 text-[8px] font-bold text-gray-400 uppercase">Histórico (20s)</p>
                    {stats.pings.map((p, i) => {
                        const height = Math.min(100, (p / 500) * 100);
                        const color = p < 100 ? 'bg-emerald-400' : (p < 300 ? 'bg-yellow-400' : 'bg-red-400');
                        return (
                            <div key={i} className={`flex-1 rounded-t-sm ${color} opacity-80 hover:opacity-100 transition-all`} style={{height: `${height}%`}} title={`${p}ms`}></div>
                        );
                    })}
                </div>
            </div>
        </CompactModal>
    );
};

export default PingDetailsModal;
