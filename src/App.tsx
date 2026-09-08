import { useMemo, useState } from "react";
import {
  BarChart3, CheckSquare, Plus, Settings, Sparkles,
  Target, Trash2, WalletCards, X
} from "lucide-react";
import {
  format, isFuture, parseISO, addDays, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth
} from "date-fns";
import { ru } from "date-fns/locale";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";
import { useStore } from "./store";
import type { Priority, TransactionType } from "./types";

type Tab = "habits" | "tasks" | "finance" | "analytics" | "profile";

const today = () => format(new Date(), "yyyy-MM-dd");
const money = (value: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value);

function Modal({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-auto p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Закрыть"><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="text-sm muted">{label}</span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="mt-1 w-full rounded-xl border-0 bg-black/5 p-3 outline-none dark:bg-white/10"
    />
  );
}

function Page({
  title,
  action,
  children
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="safe-bottom mx-auto max-w-2xl px-4 pt-5">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-black">{title}</h1>
        {action}
      </header>
      {children}
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-sm muted">{title}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function calcStreak(completions: string[]) {
  const dates = new Set(completions);
  let count = 0;
  let cursor = new Date();
  while (dates.has(format(cursor, "yyyy-MM-dd"))) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

function Habits() {
  const { habits, addHabit, toggleHabit, removeHabit } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Личное");
  const [color, setColor] = useState("#2481cc");

  const completed = habits.filter((h) => h.completions.includes(today())).length;
  const percent = habits.length ? Math.round(completed / habits.length * 100) : 0;

  return (
    <Page
      title="Привычки"
      action={
        <button className="primary rounded-full p-3" onClick={() => setOpen(true)}>
          <Plus />
        </button>
      }
    >
      <div className="card mb-4 p-5">
        <div className="flex justify-between">
          <div>
            <div className="muted">Сегодня</div>
            <div className="mt-1 text-3xl font-bold">{completed}/{habits.length}</div>
          </div>
          <div className="text-right">
            <div className="muted">Выполнение</div>
            <div className="mt-1 text-2xl font-bold">{percent}%</div>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-black/10">
          <div className="primary h-2 rounded-full" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {habits.map((habit) => {
          const done = habit.completions.includes(today());
          const streak = calcStreak(habit.completions);

          return (
            <div className="card flex items-center gap-3 p-4" key={habit.id}>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                style={{ background: habit.color }}
              >
                <Target size={21} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{habit.name}</div>
                <div className="text-sm muted">
                  {habit.category} · 🔥 {streak} дней
                </div>
              </div>
              <button
                onClick={() => toggleHabit(habit.id)}
                className={`rounded-xl px-4 py-2 font-semibold ${done ? "bg-green-500 text-white" : "bg-black/5"}`}
              >
                {done ? "✓" : "Выполнено"}
              </button>
              <button className="muted" onClick={() => removeHabit(habit.id)}>
                <Trash2 size={17} />
              </button>
            </div>
          );
        })}
      </div>

      {open && (
        <Modal title="Новая привычка" onClose={() => setOpen(false)}>
          <Field label="Название">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, читать 20 минут"
            />
          </Field>
          <Field label="Категория">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field label="Цвет">
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-1 h-12 w-full"
            />
          </Field>
          <button
            className="primary w-full rounded-xl p-3 font-semibold"
            onClick={() => {
              if (!name.trim()) return;
              addHabit({ name: name.trim(), category, color });
              setName("");
              setOpen(false);
            }}
          >
            Создать
          </button>
        </Modal>
      )}
    </Page>
  );
}

function Tasks() {
  const { tasks, addTask, toggleTask, removeTask } = useStore();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState(today());

  const visible = tasks.filter((task) => {
    if (filter === "done") return task.completed;
    if (filter === "today") return task.dueDate === today() && !task.completed;
    if (filter === "upcoming") return !!task.dueDate && isFuture(parseISO(task.dueDate));
    return true;
  });

  return (
    <Page
      title="Задачи"
      action={
        <button className="primary rounded-full p-3" onClick={() => setOpen(true)}>
          <Plus />
        </button>
      }
    >
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {[
          ["all", "Все"],
          ["today", "Сегодня"],
          ["upcoming", "Предстоящие"],
          ["done", "Выполненные"]
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`whitespace-nowrap rounded-full px-4 py-2 ${filter === value ? "primary" : "bg-black/5"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((task) => (
          <div className="card flex items-center gap-3 p-4" key={task.id}>
            <button
              onClick={() => toggleTask(task.id)}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${task.completed ? "border-green-500 bg-green-500 text-white" : "border-gray-300"}`}
            >
              {task.completed ? "✓" : ""}
            </button>
            <div className="flex-1">
              <div className={`font-semibold ${task.completed ? "line-through opacity-50" : ""}`}>
                {task.title}
              </div>
              <div className="text-sm muted">
                {task.dueDate || "Без дедлайна"} ·{" "}
                {task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
              </div>
            </div>
            <button className="muted" onClick={() => removeTask(task.id)}>
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>

      {open && (
        <Modal title="Новая задача" onClose={() => setOpen(false)}>
          <Field label="Название">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Что нужно сделать?" />
          </Field>
          <Field label="Приоритет">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="mt-1 w-full rounded-xl bg-black/5 p-3"
            >
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </Field>
          <Field label="Дедлайн">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <button
            className="primary w-full rounded-xl p-3 font-semibold"
            onClick={() => {
              if (!title.trim()) return;
              addTask({ title: title.trim(), priority, dueDate });
              setTitle("");
              setOpen(false);
            }}
          >
            Добавить
          </button>
        </Modal>
      )}
    </Page>
  );
}

function Finance() {
  const {
    transactions, categories, wallets,
    addTransaction, removeTransaction, addWallet, addCategory
  } = useStore();

  const [open, setOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories.find(c => c.type === "expense")?.id ?? "");
  const [comment, setComment] = useState("");

  const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const balance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  return (
    <Page
      title="Финансы"
      action={
        <button className="primary rounded-full p-3" onClick={() => setOpen(true)}>
          <Plus />
        </button>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Stat title="Баланс" value={`${money(balance)} ₽`} />
        <Stat title="Расходы" value={`${money(expense)} ₽`} />
        <Stat title="Доходы" value={`${money(income)} ₽`} />
        <Stat title="Операции" value={String(transactions.length)} />
      </div>

      <div className="card mb-4 p-4">
        <div className="flex items-center justify-between">
          <b>Кошельки</b>
          <button className="primary rounded-lg px-3 py-1" onClick={() => setWalletOpen(true)}>+ счёт</button>
        </div>
        {wallets.map(wallet => (
          <div className="mt-3 flex justify-between" key={wallet.id}>
            <span>{wallet.name}</span>
            <b>{money(wallet.balance)} {wallet.currency}</b>
          </div>
        ))}
      </div>

      <div className="card mb-4 p-4">
        <div className="flex justify-between">
          <b>Категории</b>
          <button className="muted" onClick={() => setCategoryOpen(true)}>Добавить</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map(category => (
            <span className="rounded-full bg-black/5 px-3 py-1 text-sm" key={category.id}>
              {category.name}
            </span>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <b>Последние операции</b>
        {transactions.length === 0 && (
          <div className="py-8 text-center muted">Пока нет операций</div>
        )}
        {transactions.slice().reverse().map(transaction => (
          <div className="flex items-center gap-3 border-b border-black/5 py-3" key={transaction.id}>
            <div className="flex-1">
              {categories.find(c => c.id === transaction.categoryId)?.name ?? "Категория"}
              <div className="text-xs muted">{transaction.comment || ""}</div>
            </div>
            <b className={transaction.type === "income" ? "text-green-500" : ""}>
              {transaction.type === "income" ? "+" : "-"}{money(transaction.amount)} ₽
            </b>
            <button className="muted" onClick={() => removeTransaction(transaction.id)}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {open && (
        <Modal title="Новая операция" onClose={() => setOpen(false)}>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {(["expense", "income"] as TransactionType[]).map(value => (
              <button
                key={value}
                onClick={() => {
                  setType(value);
                  setCategoryId(categories.find(c => c.type === value)?.id ?? "");
                }}
                className={`rounded-xl p-3 ${type === value ? "primary" : "bg-black/5"}`}
              >
                {value === "expense" ? "Расход" : "Доход"}
              </button>
            ))}
          </div>
          <Field label="Сумма">
            <Input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Категория">
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/5 p-3"
            >
              {categories.filter(c => c.type === type).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Комментарий">
            <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Необязательно" />
          </Field>
          <button
            className="primary w-full rounded-xl p-3 font-semibold"
            onClick={() => {
              const numericAmount = Number(amount);
              if (!numericAmount || !categoryId || !wallets[0]) return;
              addTransaction({
                type,
                amount: numericAmount,
                categoryId,
                walletId: wallets[0].id,
                comment,
                date: today()
              });
              setAmount("");
              setComment("");
              setOpen(false);
            }}
          >
            Сохранить
          </button>
        </Modal>
      )}

      {walletOpen && (
        <SimpleWallet
          onClose={() => setWalletOpen(false)}
          onAdd={(wallet) => { addWallet(wallet); setWalletOpen(false); }}
        />
      )}

      {categoryOpen && (
        <SimpleCategory
          onClose={() => setCategoryOpen(false)}
          onAdd={(category) => { addCategory(category); setCategoryOpen(false); }}
        />
      )}
    </Page>
  );
}

function SimpleWallet({ onClose, onAdd }: { onClose: () => void; onAdd: (value: Omit<any, "id">) => void }) {
  const [name, setName] = useState("");
  return (
    <Modal title="Новый кошелёк" onClose={onClose}>
      <Field label="Название">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Например, Карта" />
      </Field>
      <button className="primary w-full rounded-xl p-3" onClick={() => name.trim() && onAdd({ name: name.trim(), balance: 0, currency: "₽" })}>
        Создать
      </button>
    </Modal>
  );
}

function SimpleCategory({ onClose, onAdd }: { onClose: () => void; onAdd: (value: Omit<any, "id">) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("expense");

  return (
    <Modal title="Новая категория" onClose={onClose}>
      <Field label="Название">
        <Input value={name} onChange={e => setName(e.target.value)} />
      </Field>
      <Field label="Тип">
        <select value={type} onChange={e => setType(e.target.value as TransactionType)} className="mt-1 w-full rounded-xl bg-black/5 p-3">
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </select>
      </Field>
      <button className="primary w-full rounded-xl p-3" onClick={() => name.trim() && onAdd({ name: name.trim(), type, color: "#2481cc" })}>
        Создать
      </button>
    </Modal>
  );
}

function Analytics() {
  const { habits, tasks, transactions, categories } = useStore();
  const income = transactions.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const completedHabits = habits.filter(h => h.completions.includes(today())).length;
  const completedTasks = tasks.filter(t => t.completed).length;

  const chartData = categories
    .filter(c => c.type === "expense")
    .map(c => ({
      name: c.name,
      value: transactions.filter(t => t.categoryId === c.id).reduce((a, t) => a + t.amount, 0)
    }))
    .filter(item => item.value > 0);

  return (
    <Page title="Аналитика">
      <div className="grid grid-cols-2 gap-3">
        <Stat title="Привычки сегодня" value={`${completedHabits}/${habits.length}`} />
        <Stat title="Задачи" value={`${completedTasks}/${tasks.length}`} />
        <Stat title="Доходы" value={`${money(income)} ₽`} />
        <Stat title="Расходы" value={`${money(expense)} ₽`} />
      </div>

      <div className="card mt-4 p-4">
        <b>Расходы по категориям</b>
        {chartData.length ? (
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                  {chartData.map((_, index) => <Cell key={index} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-10 text-center muted">Добавьте расходы, чтобы увидеть диаграмму</div>
        )}
      </div>
    </Page>
  );
}

function Profile() {
  const { premium, patch, habits, tasks, transactions } = useStore();

  const exportData = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      habits,
      tasks,
      transactions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "habitflow-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Page title="Профиль">
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="primary flex h-14 w-14 items-center justify-center rounded-full">
            <Settings />
          </div>
          <div>
            <div className="text-lg font-bold">Мой HabitFlow</div>
            <div className="muted">Telegram Mini App</div>
          </div>
        </div>
      </div>

      <div className="card mt-3 p-5">
        <div className="flex items-center gap-3">
          <Sparkles />
          <div className="flex-1">
            <b>Premium</b>
            <div className="text-sm muted">Расширенная аналитика и возможности</div>
          </div>
          <button className="primary rounded-xl px-4 py-2" onClick={() => patch({ premium: true })}>
            {premium ? "Активен" : "Подключить"}
          </button>
        </div>
      </div>

      <button className="card mt-3 w-full p-4 text-left" onClick={exportData}>
        📦 Экспорт данных JSON
      </button>

      <div className="card mt-3 p-5">
        <b>Реферальная система</b>
        <p className="text-sm muted">Заготовка для реферальной ссылки Telegram.</p>
        <button
          className="primary rounded-xl px-4 py-2"
          onClick={() => navigator.clipboard?.writeText("https://t.me/HabitFlowBot?start=ref_demo")}
        >
          Копировать ссылку
        </button>
      </div>
    </Page>
  );
}

function Onboarding({ done }: { done: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-5 text-6xl">🌊</div>
        <h1 className="text-4xl font-black">HabitFlow</h1>
        <p className="mt-3 text-lg muted">Привычки, задачи и финансы — в одном месте.</p>

        <div className="card mt-6 space-y-3 p-5 text-left">
          <div>🔥 Отслеживайте привычки и streaks</div>
          <div>✓ Управляйте задачами и дедлайнами</div>
          <div>💰 Контролируйте расходы и накопления</div>
          <div>📊 Анализируйте прогресс</div>
        </div>

        <button className="primary mt-5 w-full rounded-2xl p-4 font-bold" onClick={done}>
          Начать
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { onboardingDone, patch, hydrated } = useStore();
  const [tab, setTab] = useState<Tab>("habits");

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center font-bold">HabitFlow…</div>;
  }

  if (!onboardingDone) {
    return <Onboarding done={() => patch({ onboardingDone: true })} />;
  }

  const content = useMemo(() => {
    switch (tab) {
      case "habits": return <Habits />;
      case "tasks": return <Tasks />;
      case "finance": return <Finance />;
      case "analytics": return <Analytics />;
      case "profile": return <Profile />;
    }
  }, [tab]);

  const navigation: [Tab, string, React.ComponentType<{ size?: number }>][] = [
    ["habits", "Привычки", Target],
    ["tasks", "Задачи", CheckSquare],
    ["finance", "Финансы", WalletCards],
    ["analytics", "Аналитика", BarChart3],
    ["profile", "Профиль", Settings]
  ];

  return (
    <div className="min-h-screen">
      {content}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-[var(--tg-theme-bg-color,#f4f5f7)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl justify-around py-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
          {navigation.map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-xs ${tab === value ? "text-[var(--tg-theme-button-color,#2481cc)]" : "muted"}`}
            >
              <Icon size={21} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}