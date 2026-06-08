FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install
RUN pnpm build

EXPOSE 5000

CMD ["node", "dist/server.js"]