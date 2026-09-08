# HabitFlow

Telegram Mini App «Привычки + Задачи + Финансы».

## Структура

```text
HabitFlow/
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── manifest.json
│   └── favicon.svg
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── style.css
│   ├── store.ts
│   ├── storage.ts
│   └── types.ts
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
└── vite.config.ts
```

## Запуск

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
npm run preview
```

## Telegram

Разместите `dist` на HTTPS-хостинге и укажите URL как Web App для Telegram-бота.

Данные сохраняются в Telegram CloudStorage, если API доступен. В обычном браузере используется localStorage.

## Безопасность

Telegram Bot API token нельзя помещать во frontend. Реальные уведомления и Telegram Stars должны выполняться через backend/serverless-функцию.
