FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .

COPY apps ./apps
COPY packages ./packages

RUN pnpm install

RUN pnpm --filter shared-types build
RUN pnpm --filter api build

EXPOSE 5000

CMD ["node","apps/api/dist/server.js"]
