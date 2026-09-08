import WebApp from "@twa-dev/sdk";
import type { AppData } from "./types";

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "uphabit:session:v1";

export interface TelegramProfile {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  languageCode?: string;
  telegramPremium?: boolean;
}

export interface AuthResponse {
  token: string;
  user: TelegramProfile;
  data: AppData;
  startParam: string | null;
}

export function getApiUrl() { return API_URL; }
export function getSessionToken() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
export function setSessionToken(token: string) { try { localStorage.setItem(TOKEN_KEY, token); } catch {} }

export function telegramInitData(): string {
  try { return String((WebApp as any).initData ?? ""); } catch { return ""; }
}

export async function authenticate(defaultData: AppData): Promise<AuthResponse | null> {
  if (!API_URL) return null;
  const initData = telegramInitData();
  if (!initData) return null;

  const response = await fetch(`${API_URL}/api/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData, defaultData }),
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Telegram authentication failed");
  const result = await response.json() as AuthResponse;
  setSessionToken(result.token);
  return result;
}

export async function loadRemote(): Promise<{ user: TelegramProfile; data: AppData } | null> {
  if (!API_URL) return null;
  const token = getSessionToken();
  if (!token) return null;
  const response = await fetch(`${API_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) return null;
  return response.json();
}

export async function saveRemote(data: AppData): Promise<boolean> {
  if (!API_URL) return false;
  const token = getSessionToken();
  if (!token) return false;
  const response = await fetch(`${API_URL}/api/me/data`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data }),
  });
  if (response.status === 401) {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    return false;
  }
  return response.ok;
}
