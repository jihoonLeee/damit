FROM node:24-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY public ./public
COPY src ./src
COPY scripts ./scripts

EXPOSE 3000

CMD ["npm", "start"]