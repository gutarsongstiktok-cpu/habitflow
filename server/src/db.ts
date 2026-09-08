import pg from "pg";
import type { AppData, TelegramUser } from "./types.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Database requests will fail until it is configured.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") || process.env.NODE_ENV === "development"
    ? false
    : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export async function initDb() {
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS uphabit;
    CREATE TABLE IF NOT EXISTS uphabit.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      telegram_id BIGINT UNIQUE NOT NULL,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      photo_url TEXT,
      language_code TEXT,
      telegram_premium BOOLEAN NOT NULL DEFAULT FALSE,
      app_data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON uphabit.users (telegram_id);
  `);
}

export async function upsertUser(user: TelegramUser, defaultData: AppData) {
  const result = await pool.query(
    `
      INSERT INTO uphabit.users (
        telegram_id, username, first_name, last_name, photo_url,
        language_code, telegram_premium, app_data
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
      ON CONFLICT (telegram_id) DO UPDATE SET
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        photo_url = EXCLUDED.photo_url,
        language_code = EXCLUDED.language_code,
        telegram_premium = EXCLUDED.telegram_premium,
        updated_at = NOW()
      RETURNING id, telegram_id, username, first_name, last_name, photo_url,
                language_code, telegram_premium, app_data, created_at, updated_at;
    `,
    [
      user.id,
      user.username ?? null,
      user.first_name ?? null,
      user.last_name ?? null,
      user.photo_url ?? null,
      user.language_code ?? null,
      user.is_premium === true,
      JSON.stringify(defaultData),
    ],
  );

  return result.rows[0];
}

export async function getUserById(id: string) {
  const result = await pool.query(`SELECT * FROM uphabit.users WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function updateUserData(id: string, data: AppData) {
  const result = await pool.query(
    `UPDATE uphabit.users SET app_data = $2::jsonb, updated_at = NOW() WHERE id = $1 RETURNING app_data, updated_at`,
    [id, JSON.stringify(data)],
  );
  return result.rows[0] ?? null;
}

export async function listUsers() {
  const result = await pool.query(`SELECT id, telegram_id, app_data FROM uphabit.users`);
  return result.rows;
}
