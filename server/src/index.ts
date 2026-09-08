import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb, getUserById, updateUserData, upsertUser } from "./db.js";
import { validateTelegramInitData } from "./telegram.js";
import { createSession, requireAuth, type AuthRequest } from "./auth.js";
import type { AppData } from "./types.js";

const app = express();
const port = Number(process.env.PORT ?? 10000);
const botToken = process.env.BOT_TOKEN ?? "";
const sessionSecret = process.env.SESSION_SECRET ?? "";
const maxAge = Number(process.env.TELEGRAM_INIT_DATA_MAX_AGE ?? 86400);

const allowedOrigins = (process.env.CORS_ORIGIN ?? "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin is not allowed"));
  },
}));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_req, res) => {
  res.json({ ok: true, service: "uphabit-backend", time: new Date().toISOString() });
});

app.post("/api/auth/telegram", async (req, res) => {
  try {
    if (!botToken || !sessionSecret) return res.status(500).json({ error: "Backend secrets are not configured" });
    const initData = String(req.body?.initData ?? "");
    const validated = validateTelegramInitData(initData, botToken, maxAge);

    const defaultData: AppData = req.body?.defaultData ?? {
      habits: [], tasks: [], wallets: [], categories: [], transactions: [], budgets: [], goals: [],
      onboardingDone: false, premium: false,
    };

    const user = await upsertUser(validated.user, defaultData);
    const token = createSession(user.id, sessionSecret);

    res.json({
      token,
      user: {
        id: user.id,
        telegramId: String(user.telegram_id),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        photoUrl: user.photo_url,
        languageCode: user.language_code,
        telegramPremium: user.telegram_premium,
      },
      data: user.app_data,
      startParam: validated.startParam ?? null,
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: error instanceof Error ? error.message : "Telegram authentication failed" });
  }
});

app.get("/api/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getUserById(req.userId!);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      user: {
        id: user.id,
        telegramId: String(user.telegram_id),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        photoUrl: user.photo_url,
        languageCode: user.language_code,
        telegramPremium: user.telegram_premium,
      },
      data: user.app_data,
      updatedAt: user.updated_at,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load user" });
  }
});

app.put("/api/me/data", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = req.body?.data as AppData | undefined;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "data is required" });
    const updated = await updateUserData(req.userId!, data);
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true, data: updated.app_data, updatedAt: updated.updated_at });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save data" });
  }
});

app.get("/", (_req, res) => res.json({ service: "UpHabit Backend", status: "online" }));

async function start() {
  try {
    await initDb();
    app.listen(port, "0.0.0.0", () => console.log(`UpHabit backend listening on ${port}`));
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

void start();
