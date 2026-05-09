# Usa uma imagem leve do Node.js
FROM node:22-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia todo o código fonte
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Executa o build do Frontend (Vite gera a pasta /dist)
RUN npm run build

# Expõe a porta que o server.js usa
EXPOSE 3000

# Comando para iniciar o servidor (aplica migrations + inicia)
CMD ["sh", "-c", "npx prisma db push && node server.js"]