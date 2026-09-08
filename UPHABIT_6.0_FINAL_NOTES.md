# UpHabit 6.0 FINAL

This build is based on the working UpHabit 5.2 architecture and keeps the same PostgreSQL JSONB app_data contract. Existing records remain compatible because all new fields are optional and normalization supplies defaults.

## Main modules
- Today dashboard / Momentum
- Habit system / monthly calendar / streaks / records / frequency / reminders
- Tasks / priorities / deadlines / repeat
- Finance / wallets / transactions / budgets / savings goals / category chart
- Unified calendar
- Analytics / 7-day trend / Momentum Score
- Gamification / levels / XP / coins / achievements / daily challenges / Reward Store
- Profile / export / reset / settings / themes
- AI Coach Pro with backend OpenAI Responses API and local fallback
- Telegram reminder scheduler on backend

## Deployment
Frontend:
- Render root: project root
- Build: npm install && npm run build
- Start: npm run start
- VITE_API_URL=https://uphabit-backend.onrender.com

Backend:
- Render root: server
- Build: npm install && npm run build
- Start: npm start
- Node >= 20

Backend variables:
DATABASE_URL
BOT_TOKEN
SESSION_SECRET
PUBLIC_BASE_URL=https://uphabit-backend.onrender.com
MINI_APP_URL=https://habitflow-bzui.onrender.com
CORS_ORIGIN=https://habitflow-bzui.onrender.com
OPENAI_API_KEY=<your key>
OPENAI_MODEL=gpt-5.6-luna
TELEGRAM_WEBHOOK_SECRET=<optional>

## Important
The AI key belongs only in Render backend environment variables. Do not put it into frontend `.env` or GitHub.

The archive intentionally contains no node_modules and no secrets.
