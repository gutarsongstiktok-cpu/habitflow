import crypto from "node:crypto";
import type { TelegramUser } from "./types.js";

export interface ValidatedInitData {
  user: TelegramUser;
  authDate: number;
  queryId?: string;
  startParam?: string;
}

export function validateTelegramInitData(initData: string, botToken: string, maxAgeSeconds: number): ValidatedInitData {
  if (!initData || !botToken) throw new Error("Telegram authentication is not configured");

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  const authDateRaw = params.get("auth_date");
  if (!receivedHash || !authDateRaw) throw new Error("Invalid Telegram initData");

  const authDate = Number(authDateRaw);
  if (!Number.isFinite(authDate)) throw new Error("Invalid auth_date");

  const age = Math.floor(Date.now() / 1000) - authDate;
  if (age < -60 || age > maxAgeSeconds) throw new Error("Telegram initData expired");

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const received = Buffer.from(receivedHash, "hex");
  const calculated = Buffer.from(calculatedHash, "hex");
  if (received.length !== calculated.length || !crypto.timingSafeEqual(received, calculated)) {
    throw new Error("Telegram initData signature is invalid");
  }

  const userRaw = params.get("user");
  if (!userRaw) throw new Error("Telegram user is missing");

  let user: TelegramUser;
  try {
    user = JSON.parse(userRaw) as TelegramUser;
  } catch {
    throw new Error("Telegram user data is invalid");
  }

  if (!user?.id) throw new Error("Telegram user ID is missing");

  return {
    user,
    authDate,
    queryId: params.get("query_id") ?? undefined,
    startParam: params.get("start_param") ?? undefined,
  };
}
