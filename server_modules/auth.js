import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

export const register = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios' });
        }

        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Nome de usuário já está em uso' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        const user = await prisma.user.create({
            data: { username, passwordHash }
        });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Nenhum token fornecido' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Formato de token inválido' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};
