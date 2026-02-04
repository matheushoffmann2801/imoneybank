// c:\Users\Admin\imoney-local\manager.js
import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- LÓGICA DE DISPATCHER (PAI vs FILHO) ---
if (process.argv.includes('--game-server')) {
    // MODO FILHO: Inicia o Backend do Jogo
    console.log('[GAME] Iniciando processo do jogo...');
    import('./server.js');
} else {
    // MODO PAI: Inicia o Manager (Launcher)
    const app = express();
    const PORT = 8888;
    let gameProcess = null;

    app.use(express.json());
    
    // Serve a UI do Manager
    app.use(express.static(path.join(__dirname, 'manager-ui')));

    const startGame = () => {
        if (gameProcess) return;

        // Se estiver rodando via PKG (executável), spawna a si mesmo com flag
        // Se estiver em dev (node), spawna o node com server.js
        const isPkg = typeof process.pkg !== 'undefined';
        const cmd = isPkg ? process.execPath : 'node';
        const args = isPkg ? ['--game-server'] : ['server.js'];

        gameProcess = spawn(cmd, args, {
            stdio: 'inherit', // Herda logs para o console principal
            cwd: __dirname
        });

        console.log(`[MANAGER] Jogo iniciado (PID: ${gameProcess.pid})`);

        gameProcess.on('close', (code) => {
            console.log(`[MANAGER] Processo do jogo encerrou (Código: ${code})`);
            gameProcess = null;
        });
    };

    const stopGame = () => {
        if (gameProcess) {
            gameProcess.kill();
            gameProcess = null;
        }
    };

    // --- API DO MANAGER ---
    app.get('/status', (req, res) => {
        res.json({ running: !!gameProcess, pid: gameProcess?.pid });
    });

    app.post('/action', (req, res) => {
        const { action } = req.body;
        if (action === 'start') {
            startGame();
            res.json({ success: true });
        } else if (action === 'stop') {
            stopGame();
            res.json({ success: true });
        } else if (action === 'restart') {
            stopGame();
            setTimeout(() => {
                startGame();
                res.json({ success: true });
            }, 1500);
        } else {
            res.status(400).json({ error: 'Ação inválida' });
        }
    });

    app.post('/reset', async (req, res) => {
        try {
            // Proxy para o servidor do jogo na porta 3000
            const response = await fetch('http://localhost:3000/api/admin/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: '@Matheus6584' })
            });
            const data = await response.json();
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: 'Falha ao comunicar com o jogo. Verifique se ele está rodando.' });
        }
    });

    // Inicia o jogo automaticamente ao abrir o launcher
    startGame();

    app.listen(PORT, () => {
        console.log(`================================================`);
        console.log(`🚀 MANAGER RODANDO: http://localhost:${PORT}`);
        console.log(`🎮 JOGO RODANDO:    http://localhost:3000`);
        console.log(`================================================`);
    });
}
