# UpHabit 3.0 — Telegram Mini App + Backend

UpHabit is a Telegram Mini App for habits, tasks, finance and analytics.

## Current architecture

- Frontend: React + TypeScript + Vite + Zustand
- Telegram Mini Apps SDK: `@twa-dev/sdk`
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL
- Telegram Mini App authentication: server-side `initData` validation
- Session: signed HTTP Bearer token
- Storage fallback: localStorage + Telegram CloudStorage

## Deploy frontend

Render Web Service:

- Build: `npm install && npm run build`
- Start: `npm run start`
- Environment variable: `VITE_API_URL=https://YOUR-BACKEND.onrender.com`

## Deploy backend

Create a second Render Web Service from the same repository:

- Root Directory: `server`
- Build: `npm install && npm run build`
- Start: `npm start`
- Node: 20+

Environment variables:

- `DATABASE_URL` — Internal Database URL from Render PostgreSQL
- `BOT_TOKEN` — token from @BotFather (keep secret; never put it in frontend)
- `SESSION_SECRET` — long random secret
- `CORS_ORIGIN` — frontend URL, e.g. `https://habitflow-zxq3.onrender.com`
- `TELEGRAM_INIT_DATA_MAX_AGE` — optional, default `86400`

Health check:

`GET /api/health`

## Telegram setup

Set the frontend HTTPS URL as the Main Mini App URL in @BotFather.

The frontend sends Telegram `initData` to `/api/auth/telegram`. The backend verifies its signature with the bot token, creates/updates the user in PostgreSQL and returns a signed session token.

## Important

Never commit `.env`, `BOT_TOKEN`, `DATABASE_URL` or `SESSION_SECRET` to GitHub.
