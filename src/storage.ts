import type { AppData } from "./types";

const STORAGE_KEY = "habitflow:data:v1";

export function loadLocal(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as AppData : null;
  } catch {
    return null;
  }
}

export function saveLocal(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota/private mode errors.
  }
}

export async function loadCloud(): Promise<AppData | null> {
  const cloudStorage = (window as any).Telegram?.WebApp?.CloudStorage;
  if (!cloudStorage?.getItem) return null;

  return new Promise((resolve) => {
    cloudStorage.getItem(STORAGE_KEY, (error: unknown, value: string) => {
      if (error || !value) return resolve(null);
      try {
        resolve(JSON.parse(value) as AppData);
      } catch {
        resolve(null);
      }
    });
  });
}

export async function saveCloud(data: AppData): Promise<void> {
  const cloudStorage = (window as any).Telegram?.WebApp?.CloudStorage;
  if (!cloudStorage?.setItem) return;

  return new Promise((resolve) => {
    cloudStorage.setItem(STORAGE_KEY, JSON.stringify(data), () => resolve());
  });
}

export async function saveEverywhere(data: AppData): Promise<void> {
  saveLocal(data);
  await saveCloud(data);
}