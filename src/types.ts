export type Priority = "high" | "medium" | "low";
export type TransactionType = "income" | "expense";
export type RepeatRule = "none" | "daily" | "weekly" | "monthly";

export interface Habit {
  id: string; name: string; category: string; color: string; reminder?: string;
  createdAt: string; completions: string[];
}
export interface Task {
  id: string; title: string; priority: Priority; dueDate?: string; repeat?: RepeatRule;
  completed: boolean; createdAt: string;
}
export interface Wallet { id: string; name: string; balance: number; currency: string; }
export interface Category { id: string; name: string; type: TransactionType; color: string; }
export interface Transaction {
  id: string; type: TransactionType; amount: number; categoryId: string; walletId: string;
  comment?: string; date: string;
}
export interface Budget { id: string; categoryId: string; month: string; limit: number; }
export interface SavingsGoal { id: string; name: string; target: number; saved: number; deadline?: string; }
export interface Gamification { xp: number; coins: number; achievements: string[]; events: string[]; }

export interface AppData {
  habits: Habit[]; tasks: Task[]; wallets: Wallet[]; categories: Category[];
  transactions: Transaction[]; budgets: Budget[]; goals: SavingsGoal[];
  onboardingDone: boolean; premium: boolean; gamification: Gamification;
}