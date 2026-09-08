import { create } from "zustand";
import { format, addDays } from "date-fns";
import type { AppData, Habit, Task, Wallet, Category, Transaction, Budget, SavingsGoal, } from "./types";
import { DEFAULT_GAMIFICATION } from "./gamification";
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
  transactions: [], budgets: [], goals: [], onboardingDone: false, premium: false, gamification: { ...DEFAULT_GAMIFICATION }
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
  addXp: (amount: number, event?: string) => void;
  resetData: () => void;
}

const persist = (get: () => Store) => {
  const s = get();
  const data: AppData = {
    habits:s.habits,tasks:s.tasks,wallets:s.wallets,categories:s.categories,
    transactions:s.transactions,budgets:s.budgets,goals:s.goals,
    onboardingDone:s.onboardingDone,premium:s.premium,gamification:s.gamification
  };
  void saveEverywhere(data);
};

const normalizeData = (data: AppData): AppData => ({
  ...data,
  gamification: { ...DEFAULT_GAMIFICATION, ...(data.gamification ?? {}) },
});

const award = (get: () => Store, set: any, amount: number, event?: string) => {
  const g = get().gamification;
  if (event && g.events.includes(event)) return false;
  const xp = g.xp + amount;
  const coins = g.coins + Math.max(1, Math.round(amount / 10));
  const events = event ? [...g.events, event] : g.events;
  const achievements = [...g.achievements];
  const unlock = (id: string) => {
    if (!achievements.includes(id)) achievements.push(id);
  };
  if (xp >= 100) unlock('hundred-xp');
  if (xp >= 1000) unlock('thousand-xp');
  set({ gamification: { xp, coins, achievements, events } });
  return true;
};

export const useStore = create<Store>((set,get) => ({
  ...initial, hydrated:false, telegramUser:null,
  hydrate: async () => {
    try {
      const local = loadLocal();
      const cloud = await Promise.race([loadCloud(), new Promise<null>(r => setTimeout(()=>r(null),1400))]);
      const base = normalizeData(cloud ?? local ?? initial);

      try {
        const remote = await authenticate(base);
        if (remote) {
          set({ ...normalizeData(remote.data), telegramUser: remote.user, hydrated:true });
          return;
        }
      } catch (error) {
        console.warn("UpHabit backend authentication unavailable; using local storage.", error);
      }

      try {
        const remote = await loadRemote();
        if (remote) {
          set({ ...normalizeData(remote.data), telegramUser: remote.user, hydrated:true });
          return;
        }
      } catch {}

      set({ ...base, telegramUser:null, hydrated:true });
    } catch {
      set({ ...normalizeData(loadLocal() ?? initial), telegramUser:null, hydrated:true });
    }
  },
  patch: v => { set(v); persist(get); },
  addHabit: v => { set(s=>({habits:[...s.habits,{...v,id:id(),createdAt:new Date().toISOString(),completions:[]}]})); persist(get); },
  updateHabit: (i,v) => { set(s=>({habits:s.habits.map(h=>h.id===i?{...h,...v}:h)})); persist(get); },
  toggleHabit: (i,d=today()) => {
    const h=get().habits.find(x=>x.id===i); if(!h)return;
    const removing=h.completions.includes(d);
    set(s=>({habits:s.habits.map(x=>x.id===i?{...x,completions:removing?x.completions.filter(y=>y!==d):[...x.completions,d]}:x)}));
    if(!removing){
      award(get,set,10,`habit:${i}:${d}`);
      const all=get().habits.length>0 && get().habits.every(x=>x.completions.includes(d));
      if(all) award(get,set,50,`perfect:${d}`);
      if(get().gamification.achievements.includes('first-habit')===false){
        const g=get().gamification; set({gamification:{...g,achievements:[...g.achievements,'first-habit']}}); award(get,set,50,'achievement:first-habit');
      }
      const maxStreak=get().habits.length?Math.max(...get().habits.map(x=>{const ds=new Set(x.completions);let n=0,dt=new Date(d+'T00:00:00');while(ds.has(dt.toISOString().slice(0,10))){n++;dt.setDate(dt.getDate()-1)}return n})):0;
      if(maxStreak>=7 && !get().gamification.achievements.includes('week-streak')){ const g=get().gamification; set({gamification:{...g,achievements:[...g.achievements,'week-streak']}}); award(get,set,200,'achievement:week-streak'); }
    }
    persist(get);
  },
  removeHabit: i => { set(s=>({habits:s.habits.filter(h=>h.id!==i)})); persist(get); },
  addTask: v => { set(s=>({tasks:[...s.tasks,{...v,id:id(),createdAt:new Date().toISOString(),completed:false}]})); persist(get); },
  toggleTask: i => {
    const t=get().tasks.find(x=>x.id===i); if(!t)return;
    const completing=!t.completed;
    set(s=>({tasks:s.tasks.map(x=>x.id===i?{...x,completed:completing}:x)}));
    if(completing){
      award(get,set,20,`task:${i}`);
      if(!get().gamification.achievements.includes('first-task')){ const g=get().gamification; set({gamification:{...g,achievements:[...g.achievements,'first-task']}}); award(get,set,50,'achievement:first-task'); }
    }
    persist(get);
  },
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
  addXp: (amount,event) => { award(get,set,amount,event); persist(get); },
  resetData: () => { set({...initial, hydrated:true}); persist(get); }
}));

export { addDays };