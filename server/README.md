# UpHabit Backend

Backend foundation for the UpHabit Telegram Mini App.

## What is included

- PostgreSQL connection via `pg`.
- Automatic `users` table creation on startup.
- Secure Telegram Mini App `initData` validation using the bot token.
- Signed 30-day sessions without exposing the bot token to the frontend.
- `GET /api/health` health check.
- `POST /api/auth/telegram` Telegram login.
- `GET /api/me` current user + saved app data.
- `PUT /api/me/data` save the current UpHabit state to PostgreSQL.
- CORS restricted by `CORS_ORIGIN`.

## Render deployment

Create a separate **Web Service** from this repository.

- Root Directory: `server`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Node: 20+

Add these environment variables in Render:

- `DATABASE_URL` — Internal Database URL from Render PostgreSQL.
- `BOT_TOKEN` — token from @BotFather. **Never put it into frontend code or GitHub.**
- `SESSION_SECRET` — long random secret.
- `CORS_ORIGIN` — your frontend URL, for example `https://habitflow-zxq3.onrender.com`.
- `TELEGRAM_INIT_DATA_MAX_AGE` — optional, default `86400`.
- `PORT` — Render normally provides this automatically; `10000` is the local default.

## Important

The frontend is not switched to this API yet. The next step is to connect the existing Zustand store to `/api/auth/telegram`, `/api/me`, and `/api/me/data`, while keeping local/CloudStorage fallback so the current working Mini App remains safe during migration.


## Telegram Bot /start

The backend also handles the existing UpHabit Telegram bot. No second bot is created.

Set these Render environment variables:

```text
BOT_TOKEN=your_existing_bot_token
MINI_APP_URL=https://habitflow-bzui.onrender.com
PUBLIC_BASE_URL=https://uphabit-backend.onrender.com
```

On startup the backend registers the Telegram webhook and commands. `/start` sends a personalized welcome message and an **🚀 Открыть UpHabit** button. `/app` opens the Mini App and `/help` shows help.

`BOT_TOKEN` is the same token already used by the Mini App Telegram authentication. Never commit the token to GitHub.

If you use a custom backend domain, put that HTTPS base URL in `PUBLIC_BASE_URL`.
