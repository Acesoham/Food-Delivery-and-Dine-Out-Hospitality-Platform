<<<<<<< HEAD
# 🍕 FoodHub — Integrated Food Delivery & Dine-Out Hospitality Platform

> A production-grade MERN stack (TypeScript) platform that unifies food delivery, table reservations, and event discovery into a single ecosystem.

## 🏗️ Architecture

**Monorepo** powered by Turborepo + pnpm workspaces.

```
apps/
├── api/           → Express.js + TypeScript backend
├── web/           → React + Vite consumer frontend
packages/
├── shared-types/  → Shared TypeScript interfaces + Zod schemas
```

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- pnpm (`npm install -g pnpm`)
- MongoDB Atlas cluster (or local MongoDB)

### Setup

```bash
# 1. Clone and install
pnpm install

# 2. Create .env file in apps/api/
cp .env.example apps/api/.env
# Edit apps/api/.env with your MongoDB URI and secrets

# 3. Seed the database
pnpm --filter api run seed

# 4. Start development servers
pnpm dev
```

The API runs on `http://localhost:5000` and the web app on `http://localhost:5173`.

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Consumer | consumer@demo.com | password123 |
| Merchant | merchant@demo.com | password123 |
| Courier | courier@demo.com | password123 |

## 🔑 Key Features

- **Geospatial Discovery** — MongoDB `$geoNear` aggregation with 2dsphere indexes
- **Real-time Order Tracking** — Socket.io with typed events and room-based broadcasting
- **Gamified Reviews** — NLP-powered scoring with loyalty points
- **Secure Auth** — JWT with httpOnly cookies and refresh token rotation
- **Role-based Access** — Consumer, Merchant, Courier, Admin roles
- **Server-side Price Calculation** — Never trust client-submitted prices
- **Order State Machine** — Validated status transitions

## 📡 API Endpoints

| Route Group | Base Path | Auth |
|---|---|---|
| Auth | `/api/v1/auth` | Public (register/login) |
| Restaurants | `/api/v1/restaurants` | Public (discover) / Merchant (CRUD) |
| Orders | `/api/v1/orders` | Consumer / Merchant / Courier |
| Reviews | `/api/v1/reviews` | Consumer (submit) / Public (read) |

## 🛠️ Tech Stack

MongoDB Atlas • Express.js • React 19 • Node.js • TypeScript • Socket.io • Stripe • Zod • Zustand • TanStack Query • Turborepo

## 📄 License

MIT
=======
# Food-Delivery-and-Dine-Out-Hospitality-Platform
>>>>>>> 19c4473ebfb72457dc8d655610df4bb8450a88bd
