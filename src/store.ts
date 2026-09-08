import { create } from "zustand";
import { format, addDays } from "date-fns";
import type {
  AppData, Habit, Task, Wallet, Category, Transaction, Budget, SavingsGoal
} from "./types";
import { loadCloud, loadLocal, saveEverywhere } from "./storage";

const today = () => format(new Date(), "yyyy-MM-dd");
const makeId = () => crypto.randomUUID();

const defaultData: AppData = {
  habits: [
    {
      id: makeId(),
      name: "Выпить воду",
      category: "Здоровье",
      color: "#2481cc",
      createdAt: new Date().toISOString(),
      completions: []
    },
    {
      id: makeId(),
      name: "Тренировка",
      category: "Спорт",
      color: "#8b5cf6",
      createdAt: new Date().toISOString(),
      completions: []
    }
  ],
  tasks: [],
  wallets: [
    { id: makeId(), name: "Основной", balance: 0, currency: "₽" }
  ],
  categories: [
    { id: makeId(), name: "Продукты", type: "expense", color: "#f97316" },
    { id: makeId(), name: "Транспорт", type: "expense", color: "#8b5cf6" },
    { id: makeId(), name: "Зарплата", type: "income", color: "#22c55e" }
  ],
  transactions: [],
  budgets: [],
  goals: [],
  onboardingDone: false,
  premium: false
};

interface HabitFlowStore extends AppData {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  patch: (value: Partial<AppData>) => void;
  addHabit: (habit: Omit<Habit, "id" | "createdAt" | "completions">) => void;
  toggleHabit: (id: string, date?: string) => void;
  removeHabit: (id: string) => void;
  addTask: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  removeTransaction: (id: string) => void;
  addWallet: (wallet: Omit<Wallet, "id">) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  addBudget: (budget: Omit<Budget, "id">) => void;
  addGoal: (goal: Omit<SavingsGoal, "id">) => void;
}

const persist = (get: () => HabitFlowStore) => {
  const s = get();
  const data: AppData = {
    habits: s.habits,
    tasks: s.tasks,
    wallets: s.wallets,
    categories: s.categories,
    transactions: s.transactions,
    budgets: s.budgets,
    goals: s.goals,
    onboardingDone: s.onboardingDone,
    premium: s.premium
  };
  void saveEverywhere(data);
};

export const useStore = create<HabitFlowStore>((set, get) => ({
  ...defaultData,
  hydrated: false,

  hydrate: async () => {
  try {
    const cloudPromise = loadCloud();

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 1500);
    });

    const cloudData = await Promise.race([
      cloudPromise,
      timeoutPromise
    ]);

    const data = cloudData ?? loadLocal();

    if (data) {
      set({
        ...data,
        hydrated: true
      });
    } else {
      set({
        hydrated: true
      });
    }
  } catch (error) {
    console.warn("Storage hydration failed, using local/default data:", error);

    const localData = loadLocal();

    if (localData) {
      set({
        ...localData,
        hydrated: true
      });
    } else {
      set({
        hydrated: true
      });
    }
  }
},
  patch: (value) => {
    set(value);
    persist(get);
  },

  addHabit: (habit) => {
    set((s) => ({
      habits: [...s.habits, {
        ...habit,
        id: makeId(),
        createdAt: new Date().toISOString(),
        completions: []
      }]
    }));
    persist(get);
  },

  toggleHabit: (id, date = today()) => {
    set((s) => ({
      habits: s.habits.map((habit) => {
        if (habit.id !== id) return habit;
        const done = habit.completions.includes(date);
        return {
          ...habit,
          completions: done
            ? habit.completions.filter((d) => d !== date)
            : [...habit.completions, date]
        };
      })
    }));
    persist(get);
  },

  removeHabit: (id) => {
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
    persist(get);
  },

  addTask: (task) => {
    set((s) => ({
      tasks: [...s.tasks, {
        ...task,
        id: makeId(),
        createdAt: new Date().toISOString(),
        completed: false
      }]
    }));
    persist(get);
  },

  toggleTask: (id) => {
    set((s) => ({
      tasks: s.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    }));
    persist(get);
  },

  removeTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    persist(get);
  },

  addTransaction: (tx) => {
    set((s) => ({
      transactions: [...s.transactions, { ...tx, id: makeId() }],
      wallets: s.wallets.map((wallet) =>
        wallet.id === tx.walletId
          ? {
              ...wallet,
              balance: wallet.balance + (tx.type === "income" ? tx.amount : -tx.amount)
            }
          : wallet
      )
    }));
    persist(get);
  },

  removeTransaction: (id) => {
    const tx = get().transactions.find((item) => item.id === id);
    if (!tx) return;

    set((s) => ({
      transactions: s.transactions.filter((item) => item.id !== id),
      wallets: s.wallets.map((wallet) =>
        wallet.id === tx.walletId
          ? {
              ...wallet,
              balance: wallet.balance + (tx.type === "income" ? -tx.amount : tx.amount)
            }
          : wallet
      )
    }));
    persist(get);
  },

  addWallet: (wallet) => {
    set((s) => ({ wallets: [...s.wallets, { ...wallet, id: makeId() }] }));
    persist(get);
  },

  addCategory: (category) => {
    set((s) => ({ categories: [...s.categories, { ...category, id: makeId() }] }));
    persist(get);
  },

  addBudget: (budget) => {
    set((s) => ({ budgets: [...s.budgets, { ...budget, id: makeId() }] }));
    persist(get);
  },

  addGoal: (goal) => {
    set((s) => ({ goals: [...s.goals, { ...goal, id: makeId() }] }));
    persist(get);
  }
}));

export { addDays };
