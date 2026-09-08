import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb, getUserById, updateUserData, upsertUser, listUsers } from "./db.js";
import { validateTelegramInitData } from "./telegram.js";
import { createSession, requireAuth, type AuthRequest } from "./auth.js";
import type { AppData } from "./types.js";

const app = express();
const port = Number(process.env.PORT ?? 10000);
const botToken = process.env.BOT_TOKEN ?? "";
const sessionSecret = process.env.SESSION_SECRET ?? "";
const maxAge = Number(process.env.TELEGRAM_INIT_DATA_MAX_AGE ?? 86400);

// Telegram bot /start integration. This uses the SAME bot token that is already
// used to validate Mini App initData; no second bot is created.
const miniAppUrl = (process.env.MINI_APP_URL ?? "https://habitflow-bzui.onrender.com").replace(/\/+$/, "");
const webhookPath = "/telegram/webhook";
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

const allowedOrigins = (process.env.CORS_ORIGIN ?? "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin is not allowed"));
  },
}));
app.use(express.json({ limit: "2mb" }));


function escapeHtml(value: unknown = ""): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  chat: { id: number; type: string };
  from?: TelegramUser;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
}

async function telegramApi<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  if (!botToken) throw new Error("BOT_TOKEN is not configured");

  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json() as TelegramApiResponse<T>;
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description ?? "API error"}`);
  return data.result as T;
}

function openAppKeyboard() {
  return {
    inline_keyboard: [[
      {
        text: "🚀 Открыть UpHabit",
        web_app: { url: miniAppUrl },
      },
    ]],
  };
}

function userDisplayName(user?: TelegramUser): string {
  return escapeHtml(user?.first_name || user?.username || "друг");
}

async function sendStartMessage(chatId: number, user?: TelegramUser) {
  const name = userDisplayName(user);

  const text =
    `👋 <b>Добро пожаловать в UpHabit, ${name}!</b>\n\n` +
    `Твой персональный помощник для привычек, задач, целей и финансов.\n\n` +
    `В UpHabit ты можешь:\n` +
    `• формировать полезные привычки\n` +
    `• ставить и выполнять задачи\n` +
    `• отслеживать цели и прогресс\n` +
    `• контролировать личные финансы\n` +
    `• получать XP, монеты и достижения\n` +
    `• анализировать свои результаты\n\n` +
    `<b>Начни с первого шага — остальное сделаем вместе.</b>\n\n` +
    `Нажми кнопку ниже, чтобы открыть приложение.`;

  await telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: openAppKeyboard(),
  });
}

async function sendAppMessage(chatId: number) {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: "🚀 <b>UpHabit готов.</b>\n\nНажми кнопку ниже, чтобы открыть приложение.",
    parse_mode: "HTML",
    reply_markup: openAppKeyboard(),
  });
}

async function sendHelpMessage(chatId: number) {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text:
      "<b>UpHabit — помощь</b>\n\n" +
      "/start — приветствие и запуск приложения\n" +
      "/app — открыть UpHabit\n" +
      "/help — показать помощь",
    parse_mode: "HTML",
    reply_markup: openAppKeyboard(),
  });
}

async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  if (!message?.chat) return;

  const chatId = message.chat.id;
  const text = (message.text ?? "").trim();
  const command = text.split(/\s+/)[0].split("@")[0];

  if (command === "/start") {
    await sendStartMessage(chatId, message.from);
  } else if (command === "/app") {
    await sendAppMessage(chatId);
  } else if (command === "/help") {
    await sendHelpMessage(chatId);
  }
}

async function configureTelegramBot() {
  if (!botToken) {
    console.warn("BOT_TOKEN is not configured; Telegram /start integration is disabled.");
    return;
  }

  try {
    await telegramApi("setMyCommands", {
      commands: [
        { command: "start", description: "Запустить UpHabit" },
        { command: "app", description: "Открыть приложение" },
        { command: "help", description: "Помощь" },
      ],
    });

    const publicBaseUrl = (process.env.PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
    if (publicBaseUrl) {
      const body: Record<string, unknown> = {
        url: `${publicBaseUrl}${webhookPath}`,
        allowed_updates: ["message"],
      };
      if (webhookSecret) body.secret_token = webhookSecret;

      await telegramApi("setWebhook", body);
      console.log(`Telegram webhook configured: ${publicBaseUrl}${webhookPath}`);
    } else {
      console.warn("PUBLIC_BASE_URL is not configured; set it to https://uphabit-backend.onrender.com to enable Telegram webhook.");
    }

    const me = await telegramApi<{ username?: string; first_name?: string }>("getMe", {});
    console.log(`Telegram bot connected: @${me.username ?? me.first_name ?? "unknown"}`);
  } catch (error) {
    console.error("Telegram bot setup failed:", error);
  }
}


app.post(webhookPath, async (req, res) => {
  try {
    if (webhookSecret) {
      const receivedSecret = req.header("X-Telegram-Bot-Api-Secret-Token") ?? "";
      if (receivedSecret !== webhookSecret) return res.status(401).json({ error: "Invalid webhook secret" });
    }

    // Acknowledge Telegram quickly; processing continues before the response is
    // returned so errors can be logged without exposing them to Telegram.
    const update = req.body as TelegramUpdate;
    await handleTelegramUpdate(update);
    res.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    res.status(200).json({ ok: false });
  }
});


const openAiKey = process.env.OPENAI_API_KEY ?? "";
const openAiModel = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";

function compactCoachData(data: any) {
  return {
    habits: (data.habits ?? []).filter((h:any)=>!h.archived).map((h:any)=>({name:h.name,category:h.category,frequency:h.frequency??"daily",streak:h.completions?.length ?? 0,last:(h.completions??[]).slice(-14)})),
    tasks: (data.tasks ?? []).slice(-40).map((t:any)=>({title:t.title,priority:t.priority,dueDate:t.dueDate,completed:t.completed})),
    wallets: (data.wallets ?? []).map((w:any)=>({name:w.name,balance:w.balance,currency:w.currency})),
    transactions: (data.transactions ?? []).slice(-80).map((t:any)=>({type:t.type,amount:t.amount,date:t.date,comment:t.comment})),
    budgets: data.budgets ?? [], goals: data.goals ?? [], gamification:data.gamification ?? {},
  };
}

async function runAICoach(message: string, data: any, profile: any) {
  if (!openAiKey) throw new Error("OPENAI_API_KEY is not configured");
  const system = `Ты AI Coach приложения UpHabit. Отвечай на русском, естественно, конкретно и без морализаторства.
Ты персональный стратег по продуктивности и личным финансам. Анализируй только переданные данные, не выдумывай факты. Не давай медицинских, юридических или инвестиционных гарантий. Если вопрос про деньги — используй арифметику из данных и отделяй факт от рекомендации. Всегда заканчивай 1-3 конкретными следующими действиями. Пользователь: ${profile?.firstName ?? "пользователь"}.`;
  const payload = {
    model: openAiModel,
    store: false,
    input: [
      {role:"developer",content:system},
      {role:"user",content:`Контекст UpHabit (JSON):\n${JSON.stringify(compactCoachData(data))}\n\nЗапрос пользователя: ${message}`}
    ],
    max_output_tokens: 900,
  };
  const response = await fetch("https://api.openai.com/v1/responses", {method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${openAiKey}`},body:JSON.stringify(payload)});
  const json:any = await response.json();
  if (!response.ok) throw new Error(json?.error?.message ?? "OpenAI request failed");
  const text = json.output_text ?? (json.output ?? []).flatMap((x:any)=>x.content ?? []).filter((x:any)=>x.type==="output_text").map((x:any)=>x.text).join("\n");
  if (!text) throw new Error("AI returned empty response");
  return text;
}

async function sendReminder(chatId:number, habitName:string, reminder:string) {
  await telegramApi("sendMessage", {chat_id:chatId,text:`⏰ <b>UpHabit</b>\n\nВремя привычки: <b>${escapeHtml(habitName)}</b>\nНапоминание: ${escapeHtml(reminder)}\n\nОдин маленький шаг — и серия продолжается 🔥`,parse_mode:"HTML",reply_markup:openAppKeyboard()});
}

async function reminderTick() {
  if (!botToken) return;
  try {
    const users = await listUsers();
    const now = new Date();
    for (const user of users) {
      const data:any = user.app_data ?? {};
      if (data.settings?.remindersEnabled === false) continue;
      const habits = (data.habits ?? []).filter((h:any)=>h.reminder && !h.archived);
      if (!habits.length) continue;
      const log={...(data.reminderLog??{})};
      let changed=false;
      for (const h of habits) {
        const tz = h.timezone || "Europe/Chisinau";
        const parts = new Intl.DateTimeFormat("en-GB",{timeZone:tz,hour:"2-digit",minute:"2-digit",weekday:"short",year:"numeric",month:"2-digit",day:"2-digit",hourCycle:"h23"}).formatToParts(now);
        const hh=parts.find(x=>x.type==="hour")?.value, mm=parts.find(x=>x.type==="minute")?.value;
        const weekday=parts.find(x=>x.type==="weekday")?.value;
        const yy=parts.find(x=>x.type==="year")?.value, mo=parts.find(x=>x.type==="month")?.value, dd=parts.find(x=>x.type==="day")?.value;
        const keyDate=`${yy}-${mo}-${dd}`;
        if (!h.reminder || h.reminder!==`${hh}:${mm}`) continue;
        const dayIndex={Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:0}[weekday ?? ""] ?? 0;
        if (h.reminderDays?.length && !h.reminderDays.includes(dayIndex)) continue;
        if ((h.completions??[]).includes(keyDate)) continue;
        const key=`${h.id}:${keyDate}:${h.reminder}`;
        if (log[key]) continue;
        try { await sendReminder(Number(user.telegram_id),h.name,h.reminder); log[key]=new Date().toISOString(); changed=true; } catch (e) { console.error("Reminder failed",e); }
      }
      if (changed) await updateUserData(user.id,{...data,reminderLog:log});
    }
  } catch (e) { console.error("Reminder scheduler failed",e); }
}

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


app.post("/api/ai/coach", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = req.body?.data;
    const message = String(req.body?.message ?? "").trim();
    if (!data || !message) return res.status(400).json({error:"message and data are required"});
    const user = await getUserById(req.userId!);
    const text = await runAICoach(message, data, user ? {firstName:user.first_name,username:user.username} : null);
    res.json({text,model:openAiModel});
  } catch (error) {
    console.error("AI Coach error:",error);
    res.status(503).json({error:error instanceof Error?error.message:"AI Coach unavailable"});
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
    app.listen(port, "0.0.0.0", () => {
      console.log(`UpHabit backend listening on ${port}`);
      void configureTelegramBot();
      setInterval(() => void reminderTick(), 60_000);
      setTimeout(() => void reminderTick(), 5_000);
    });
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

void start();
