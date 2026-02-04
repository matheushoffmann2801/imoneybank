# iMoney Bank - Ultimate Edition

O **iMoney Bank** é um sistema de banco imobiliário digital multiplayer, desenvolvido para gerenciar partidas de jogos de tabuleiro modernos via navegador. Ele substitui o dinheiro de papel e automatiza regras complexas como aluguéis, juros, leilões e eventos climáticos.

## 🚀 Tecnologias Utilizadas

- **Frontend:** React (Vite), Tailwind CSS, Lucide React (Ícones).
- **Backend:** Node.js, Express.
- **Comunicação em Tempo Real:** Socket.IO.
- **Persistência:** Arquivo JSON local (`rooms.json`).

## 📋 Pré-requisitos

- Node.js (Versão 16 ou superior)
- NPM ou Yarn

## 🛠️ Instalação e Execução

1. **Instale as dependências:**
   Na pasta raiz do projeto, execute:
   ```bash
   npm install
   ```

2. **Inicie o Servidor (Backend):**
   O servidor gerencia a lógica do jogo, salas e conexões Socket.IO.
   ```bash
   node server.js
   ```
   *O servidor rodará por padrão na porta 3000.*

3. **Inicie o Cliente (Frontend):**
   Em outro terminal, inicie a interface React:
   ```bash
   npm run dev
   ```

4. **Acesso:**
   - Abra o navegador no endereço indicado pelo Vite (geralmente `http://localhost:5173` ou o IP da sua rede local para jogar no celular).

## 📂 Estrutura do Projeto

- **/src**: Código fonte do Frontend (React).
  - `App.jsx`: Componente principal e gerenciador de estado.
  - `gameLogic.js`: (No backend) Lógica central de regras, pagamentos e eventos.
  - `PropertiesDB.jsx`: Banco de dados de imóveis e configurações de aluguel.
  - `CardsDB.js`: Cartas de Sorte, Revés e Itens.
- **/server_modules**: Módulos auxiliares do Node.js.
- `server.js`: Ponto de entrada da API e Socket.IO.

## 🔐 Acesso Administrativo (Banco Central)

O sistema possui um painel administrativo para controlar a partida.
- **Senha Mestra:** `@Matheus6584` (Configurada em `gameData.js`).
- **Funções:** Adicionar/Remover dinheiro, prender jogadores, penhorar bens, resetar sala.

## 📱 Funcionalidades Principais

- **Sistema Bancário:** Transferências (Pix), Empréstimos (Sistema Price), Score de Crédito.
- **Imóveis:** Compra, Venda, Troca, Leilão, Construção e Hipoteca.
- **Eventos Dinâmicos:** Clima (Sol/Chuva afeta aluguéis), Feriados, Visitas.
- **Calendário:** Imposto de Renda, Black Friday e Natal automáticos.
- **Inventário:** Itens especiais como "Habeas Corpus" e "Cartão Black".

## 🤝 Contribuição

Desenvolvido por Matheus Hoffmann.
Versão Atual: 2.2 (imoney_v17_turns_optimized)