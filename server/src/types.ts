export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface AppData {
  habits: unknown[];
  tasks: unknown[];
  wallets: unknown[];
  categories: unknown[];
  transactions: unknown[];
  budgets: unknown[];
  goals: unknown[];
  onboardingDone: boolean;
  premium: boolean;
}
