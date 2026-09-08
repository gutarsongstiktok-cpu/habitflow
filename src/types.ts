export type Priority = "high" | "medium" | "low";
export type TransactionType = "income" | "expense";
export type RepeatRule = "none" | "daily" | "weekly" | "monthly";
export type HabitFrequency = "daily" | "weekdays" | "weekly";

export interface Habit {
  id: string; name: string; category: string; color: string; reminder?: string;
  frequency?: HabitFrequency; reminderDays?: number[]; timezone?: string; archived?: boolean;
  createdAt: string; completions: string[];
}
export interface Task {
  id: string; title: string; priority: Priority; dueDate?: string; repeat?: RepeatRule;
  completed: boolean; createdAt: string;
}
export interface Wallet { id: string; name: string; balance: number; currency: string; }
export interface Category { id: string; name: string; type: TransactionType; color: string; }
export interface Transaction { id: string; type: TransactionType; amount: number; categoryId: string; walletId: string; comment?: string; date: string; }
export interface Budget { id: string; categoryId: string; month: string; limit: number; }
export interface SavingsGoal { id: string; name: string; target: number; saved: number; deadline?: string; }
export interface Gamification { xp: number; coins: number; achievements: string[]; events: string[]; claimedChallenges?: string[]; }
export interface RewardItem { id: string; name: string; icon: string; cost: number; description: string; premium?: boolean; }
export interface AppSettings { theme?: "dark" | "light" | "system"; remindersEnabled?: boolean; weekStartsMonday?: boolean; currency?: string; aiEnabled?: boolean; }
export interface AppData {
  rewards: RewardItem[]; habits: Habit[]; tasks: Task[]; wallets: Wallet[]; categories: Category[];
  transactions: Transaction[]; budgets: Budget[]; goals: SavingsGoal[];
  onboardingDone: boolean; premium: boolean; gamification: Gamification;
  settings?: AppSettings; reminderLog?: Record<string,string>; aiHistory?: { role:"user"|"assistant"; text:string; at:string }[];
}
