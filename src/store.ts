import { create } from "zustand";
import { format, addDays } from "date-fns";
import type { AppData, Habit, Task, Wallet, Category, Transaction, Budget, SavingsGoal } from "./types";
import { loadCloud, loadLocal, saveEverywhere } from "./storage";
import { authenticate, loadRemote, type TelegramProfile } from "./api";

const today = () => format(new Date(), "yyyy-MM-dd");
const id = () => crypto.randomUUID();

const initial: AppData = {
  habits: [
    { id: id(), name: "Выпить воду", category: "Здоровье", color: "#2481cc", createdAt: new Date().toISOString(), completions: [] },
    { id: id(), name: "Тренировка", category: "Спорт", color: "#8b5cf6", createdAt: new Date().toISOString(), completions: [] }
  ],
  tasks: [],
  wallets: [{ id: id(), name: "Основной", balance: 0, currency: "₽" }],
  categories: [
    { id: id(), name: "Продукты", type: "expense", color: "#f97316" },
    { id: id(), name: "Транспорт", type: "expense", color: "#8b5cf6" },
    { id: id(), name: "Зарплата", type: "income", color: "#22c55e" }
  ],
  transactions: [], budgets: [], goals: [], onboardingDone: false, premium: false
};

interface Store extends AppData {
  hydrated: boolean;
  telegramUser: TelegramProfile | null;
  hydrate: () => Promise<void>;
  patch: (v: Partial<AppData>) => void;
  addHabit: (v: Omit<Habit, "id"|"createdAt"|"completions">) => void;
  updateHabit: (id: string, v: Partial<Habit>) => void;
  toggleHabit: (id: string, date?: string) => void;
  removeHabit: (id: string) => void;
  addTask: (v: Omit<Task, "id"|"createdAt"|"completed">) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  addTransaction: (v: Omit<Transaction, "id">) => void;
  removeTransaction: (id: string) => void;
  addWallet: (v: Omit<Wallet, "id">) => void;
  addCategory: (v: Omit<Category, "id">) => void;
  addBudget: (v: Omit<Budget, "id">) => void;
  removeBudget: (id: string) => void;
  addGoal: (v: Omit<SavingsGoal, "id">) => void;
  updateGoal: (id: string, v: Partial<SavingsGoal>) => void;
  removeGoal: (id: string) => void;
  resetData: () => void;
}

const persist = (get: () => Store) => {
  const s = get();
  const data: AppData = {
    habits:s.habits,tasks:s.tasks,wallets:s.wallets,categories:s.categories,
    transactions:s.transactions,budgets:s.budgets,goals:s.goals,
    onboardingDone:s.onboardingDone,premium:s.premium
  };
  void saveEverywhere(data);
};

export const useStore = create<Store>((set,get) => ({
  ...initial, hydrated:false, telegramUser:null,
  hydrate: async () => {
    try {
      const local = loadLocal();
      const cloud = await Promise.race([loadCloud(), new Promise<null>(r => setTimeout(()=>r(null),1400))]);
      const base = cloud ?? local ?? initial;

      try {
        const remote = await authenticate(base);
        if (remote) {
          set({ ...remote.data, telegramUser: remote.user, hydrated:true });
          return;
        }
      } catch (error) {
        console.warn("UpHabit backend authentication unavailable; using local storage.", error);
      }

      try {
        const remote = await loadRemote();
        if (remote) {
          set({ ...remote.data, telegramUser: remote.user, hydrated:true });
          return;
        }
      } catch {}

      set({ ...base, telegramUser:null, hydrated:true });
    } catch {
      set({ ...(loadLocal() ?? initial), telegramUser:null, hydrated:true });
    }
  },
  patch: v => { set(v); persist(get); },
  addHabit: v => { set(s=>({habits:[...s.habits,{...v,id:id(),createdAt:new Date().toISOString(),completions:[]}]})); persist(get); },
  updateHabit: (i,v) => { set(s=>({habits:s.habits.map(h=>h.id===i?{...h,...v}:h)})); persist(get); },
  toggleHabit: (i,d=today()) => { set(s=>({habits:s.habits.map(h=>h.id===i?{...h,completions:h.completions.includes(d)?h.completions.filter(x=>x!==d):[...h.completions,d]}:h)})); persist(get); },
  removeHabit: i => { set(s=>({habits:s.habits.filter(h=>h.id!==i)})); persist(get); },
  addTask: v => { set(s=>({tasks:[...s.tasks,{...v,id:id(),createdAt:new Date().toISOString(),completed:false}]})); persist(get); },
  toggleTask: i => { set(s=>({tasks:s.tasks.map(t=>t.id===i?{...t,completed:!t.completed}:t)})); persist(get); },
  removeTask: i => { set(s=>({tasks:s.tasks.filter(t=>t.id!==i)})); persist(get); },
  addTransaction: v => { set(s=>({transactions:[...s.transactions,{...v,id:id()}],wallets:s.wallets.map(w=>w.id===v.walletId?{...w,balance:w.balance+(v.type==="income"?v.amount:-v.amount)}:w)})); persist(get); },
  removeTransaction: i => {
    const tx=get().transactions.find(x=>x.id===i); if(!tx)return;
    set(s=>({transactions:s.transactions.filter(x=>x.id!==i),wallets:s.wallets.map(w=>w.id===tx.walletId?{...w,balance:w.balance+(tx.type==="income"?-tx.amount:tx.amount)}:w)})); persist(get);
  },
  addWallet: v => { set(s=>({wallets:[...s.wallets,{...v,id:id()}]})); persist(get); },
  addCategory: v => { set(s=>({categories:[...s.categories,{...v,id:id()}]})); persist(get); },
  addBudget: v => { set(s=>({budgets:[...s.budgets,{...v,id:id()}]})); persist(get); },
  removeBudget: i => { set(s=>({budgets:s.budgets.filter(b=>b.id!==i)})); persist(get); },
  addGoal: v => { set(s=>({goals:[...s.goals,{...v,id:id()}]})); persist(get); },
  updateGoal: (i,v) => { set(s=>({goals:s.goals.map(g=>g.id===i?{...g,...v}:g)})); persist(get); },
  removeGoal: i => { set(s=>({goals:s.goals.filter(g=>g.id!==i)})); persist(get); },
  resetData: () => { set({...initial, hydrated:true}); persist(get); }
}));

export { addDays };