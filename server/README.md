# UpHabit Backend

## Environment
Required: `DATABASE_URL`, `BOT_TOKEN`, `SESSION_SECRET`.
For AI Coach Pro set `OPENAI_API_KEY`; optional `OPENAI_MODEL` defaults to `gpt-5.6-luna`.

The backend keeps Telegram auth, PostgreSQL JSONB data persistence, Telegram `/start`, AI Coach and Telegram habit reminders in one service.
