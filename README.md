# UpHabit 6.0 — Personal Productivity OS

Финальная крупная версия Telegram Mini App: привычки, streaks, задачи, единый календарь, финансы, бюджеты, цели, аналитика, геймификация, Telegram-напоминания и AI Coach Pro.

## Что сохранено
- Telegram Mini App + существующий бот
- Telegram initData auth + Bearer session
- PostgreSQL JSONB без миграции старых данных
- localStorage + Telegram CloudStorage fallback
- существующие привычки, задачи, кошельки и операции

## Что добавлено
- AI Coach Pro через OpenAI Responses API; ключ хранится только на backend
- персональный AI-контекст: привычки, streaks, задачи, финансы, бюджеты, цели, XP
- fallback AI Coach, если API временно недоступен
- месячная карта привычек и единый календарь
- частота привычек, напоминания и Telegram scheduler
- расширенные streaks и рекорды
- задачи с приоритетом, дедлайном и повтором
- финансовые кошельки, операции, бюджеты, цели и график расходов
- Momentum Score и аналитика за 7 дней
- XP, уровни, монеты, достижения, челленджи и Reward Store
- экспорт JSON и безопасный сброс данных
- светлая/тёмная тема

## Frontend Render
Build: `npm install && npm run build`
Start: `npm run start`
Environment: `VITE_API_URL=https://uphabit-backend.onrender.com`

## Backend Render
Root Directory: `server`
Build: `npm install && npm run build`
Start: `npm start`
Node: 20+

Required: `DATABASE_URL`, `BOT_TOKEN`, `SESSION_SECRET`, `PUBLIC_BASE_URL`, `MINI_APP_URL`.
Recommended: `CORS_ORIGIN=https://habitflow-bzui.onrender.com`.

### AI Coach Pro
Set on backend Render:
- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-5.6-luna` (default)

The API key is never sent to the Telegram Mini App. The backend calls OpenAI Responses API with `store:false` and only a compact application context.

### Telegram reminders
The backend checks configured habit reminders every minute and sends a Telegram message through the existing bot. Default timezone is `Europe/Chisinau`; a habit may optionally contain `timezone` and `reminderDays` in stored JSON.

## Important
Never commit `.env`, `BOT_TOKEN`, `DATABASE_URL`, `SESSION_SECRET` or `OPENAI_API_KEY`.
